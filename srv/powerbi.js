const cds = require("@sap/cds");
const axios = require("axios");
const qs = require("qs");

module.exports = cds.service.impl(async function () {
  // const { PowerBi, ReportsExposed, SecurityFilters, ReportsToSecurityFilters } = this.entities;
  const db = await cds.connect.to("db"); // explicitly connect to the DB
  const {
    PowerBi,
    ReportsExposed,
    SecurityFilters,
    ReportsToSecurityFilters,
    Users,
  } = db.entities("portal.Power.Analytics.PowerBiPortal");
  const tokenCache = new Map();

  async function getAccessToken(config) {
    const cacheKey = config.ID;

    const cached = tokenCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.token;
    }
    const res = await axios.post(
      `${config.authorityUrl}${config.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: config.scopeBase,
      })
    );
    const token = res.data.access_token;
    const expiresIn = res.data.expires_in; // usually 3600s

    // Cache token with expiry
    tokenCache.set(cacheKey, {
      token,
      expiresAt: now + expiresIn * 1000 - 60000, // subtract 1 min buffer
    });

    return token;
  }

  function extractFilter(where, key) {
    for (let i = 0; i < where.length; i++) {
      const element = where[i];
      if (element?.ref && element.ref[0] === key) {
        const operator = where[i + 1];
        const value = where[i + 2];
        return operator === "=" || operator === "eq" ? value?.val : undefined;
      }
    }
    return undefined;
  }

  this.on("getEmbedDetails", async (req) => {
    const db = cds.db;
    const reportExposedId = req.params[0];

    try {
      const reportDetails = await db.run(
        SELECT.one.from(ReportsExposed).where({ ID: reportExposedId })
      );
      if (!reportDetails)
        return req.error(500, "Power BI report details not found!");

      const config = await db.run(
        SELECT.one
          .from(PowerBi)
          .where({ ID: reportDetails.servicePrincipal_ID })
      );
      if (!config) return req.error(500, "Power BI configuration not found.");

      const tokenResponse = await axios.post(
        `${config.authorityUrl}${config.tenantId}/oauth2/v2.0/token`,
        qs.stringify({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: config.scopeBase,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const azureToken = tokenResponse.data.access_token;

      const embedUrlResponse = await axios.get(
        `${config.biApiUrl}v1.0/myorg/groups/${reportDetails.workspaceId}/reports/${reportDetails.reportId}`,
        {
          headers: {
            Authorization: `Bearer ${azureToken}`,
          },
        }
      );

      const embedInfo = embedUrlResponse.data;

      const embedTokenResponse = await axios.post(
        `${config.biApiUrl}v1.0/myorg/groups/${reportDetails.workspaceId}/reports/${reportDetails.reportId}/GenerateToken`,
        {
          accessLevel: "view",
          datasetId: embedInfo.datasetId,
        },
        {
          headers: {
            Authorization: `Bearer ${azureToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const embedToken = embedTokenResponse.data.token;

      const reportFilters = await db.run(
        SELECT.from(SecurityFilters)
          .columns(
            "schema",
            "table",
            "column",
            "operator",
            "values",
            "requireSingleSelection"
          )
          .where({
            ID: {
              in: SELECT("filter_ID")
                .from(ReportsToSecurityFilters)
                .where({ report_ID: reportExposedId }),
            },
          })
      );
      const powerBIFilters = reportFilters.map((f) => ({
        $schema: f.schema,
        target: {
          table: f.table,
          column: f.column,
        },
        operator: f.operator,
        values: f?.values ? f.values.split(",").map((v) => v.trim()) : [],
        filterType: 1,
        requireSingleSelection: f.requireSingleSelection,
      }));

      const embedHTML = `
        <div id="reportContainer" style="height:100%;width:100%"></div>
        <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.19.1/dist/powerbi.js"></script>
        <script>
          var models = window['powerbi-client'].models;
          var embedConfiguration = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: '${embedToken}',
            embedUrl: '${embedInfo.embedUrl}',
            settings: {
              panes: {
                filters: { visible: true, expanded: true }
              }
            }
          };
          var reportContainer = document.getElementById('reportContainer');
          var report = powerbi.embed(reportContainer, embedConfiguration);

          report.on("loaded", function () {
            
          });
        </script>
      `;

      return { html: embedHTML };
    } catch (error) {
      console.error("Power BI error:", error?.response?.data || error.message);
      req.error(500, "Failed to get Power BI embed details.");
    }
  });

  this.on("checkReportAccess", async (req) => {
    const { url } = req.data;

    if (!url) return req.error(400, "URL is required.");

    try {
      // Extract workspaceId and reportId from the provided URL
      const matches = url.match(
        /groups\/([a-zA-Z0-9-]+)\/reports\/([a-zA-Z0-9-]+)/
      );
      if (!matches || matches.length < 3) {
        return req.reply({ statusCode: 400, message: "Invalid URL format." });
      }

      const [_, workspaceId, reportId] = matches;

      // Find a valid Service Principal config (assumes one per tenant, customize if needed)
      const config = await cds.db.run(SELECT.one.from(PowerBi));
      if (!config)
        return req.reply({
          statusCode: 500,
          message: "Power BI configuration not found.",
        });

      // Get access token
      const tokenResponse = await axios.post(
        `${config.authorityUrl}${config.tenantId}/oauth2/v2.0/token`,
        qs.stringify({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: config.scopeBase,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const azureToken = tokenResponse.data.access_token;

      // Check report access
      await axios.get(
        `${config.biApiUrl}v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
        {
          headers: {
            Authorization: `Bearer ${azureToken}`,
          },
        }
      );

      return req.reply({
        statusCode: 200,
        message: "Service Principal has access to the report.",
      });
    } catch (error) {
      const errMsg = error?.response?.data?.error?.message || error.message;
      console.error("Power BI access check error:", errMsg);
      return req.reply({
        statusCode: error?.response?.status || 500,
        message: `Access failed: ${errMsg}`,
      });
    }
  });

  this.on("READ", "LiveWorkspaces", async (req) => {
    const where = req.query.SELECT?.where;
    const configId = extractFilter(where, "configId");

    if (!configId) return req.error(400, "Missing configId");

    const config = await cds.run(
      SELECT.one.from(PowerBi).where({ ID: configId })
    );
    if (!config) return req.error(404, "Service Principal not found");

    const token = await getAccessToken(config);

    const response = await axios.get(`${config.biApiUrl}v1.0/myorg/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.value.map((ws) => ({
      id: ws.id,
      name: ws.name,
    }));
  });

  this.on("READ", "LiveReports", async (req) => {
    const where = req.query.SELECT?.where;
    const workspaceId = extractFilter(where, "workspaceId");
    const configId = extractFilter(where, "configId");

    if (!workspaceId || !configId)
      return req.error(400, `Missing configId or workspaceId`);

    const config = await cds.run(
      SELECT.one.from(PowerBi).where({ ID: configId })
    );

    if (!config) return req.error(404, "Service Principal not found");

    const token = await getAccessToken(config);

    const response = await axios.get(
      `${config.biApiUrl}v1.0/myorg/groups/${workspaceId}/reports`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.value.map((r) => ({
      id: r.id,
      name: r.name,
      embedUrl: r.embedUrl,
      webUrl: r.webUrl,
      datasetId: r.datasetId,
    }));
  });

  this.on("getFilterFieldsForReport", async (req) => {
    const reportID = req.params[0];
    if (!reportID) return [];

    // Get all filter associations for the given report
    const filterLinks = await SELECT.from(ReportsToSecurityFilters)
      .columns(["filter_ID"])
      .where({ report_ID: reportID });

    if (!filterLinks.length) return [];

    const filterIDs = filterLinks.map((link) => link.filter_ID);

    // Fetch actual filter metadata from SecurityFilters
    const filters = await SELECT.from(SecurityFilters)
      .columns(["table", "column", "requireSingleSelection"])
      .where({ ID: { in: filterIDs } });

    return filters.map((f) => ({
      table: f.table,
      column: f.column,
      requireSingleSelection: f.requireSingleSelection,
    }));
  });

  this.on("embedReportWithFiltersAuto", async (req) => {
    const reportExposedId = req.params[0];
    const filters = req.data.filters;
    // const { reportExposedId, filters } = req.data;
    const db = cds.db;

    try {
      const reportDetails = await db.run(
        SELECT.one.from(ReportsExposed).where({ ID: reportExposedId })
      );
      if (!reportDetails)
        return req.error(500, "Power BI report details not found!");

      const config = await db.run(
        SELECT.one
          .from(PowerBi)
          .where({ ID: reportDetails.servicePrincipal_ID })
      );
      if (!config) return req.error(500, "Power BI configuration not found.");

      const tokenResponse = await axios.post(
        `${config.authorityUrl}${config.tenantId}/oauth2/v2.0/token`,
        qs.stringify({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: config.scopeBase,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const azureToken = tokenResponse.data.access_token;

      const embedUrlResponse = await axios.get(
        `${config.biApiUrl}v1.0/myorg/groups/${reportDetails.workspaceId}/reports/${reportDetails.reportId}`,
        {
          headers: { Authorization: `Bearer ${azureToken}` },
        }
      );
      const embedInfo = embedUrlResponse.data;

      const embedTokenResponse = await axios.post(
        `${config.biApiUrl}v1.0/myorg/groups/${reportDetails.workspaceId}/reports/${reportDetails.reportId}/GenerateToken`,
        {
          accessLevel: "view",
          datasetId: embedInfo.datasetId,
        },
        {
          headers: {
            Authorization: `Bearer ${azureToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const embedToken = embedTokenResponse.data.token;

      // STEP: Fetch actual filter definitions (operator, schema, etc.)
      const definedFilters = await db.run(
        SELECT.from(SecurityFilters)
          .columns(
            "schema",
            "table",
            "column",
            "operator",
            "requireSingleSelection",
            "displaySetting_isLockedInViewMode",
            "displaySetting_isHiddenInViewMode",
            "displaySetting_displayName"
          )
          .where({
            ID: {
              in: SELECT("filter_ID")
                .from(ReportsToSecurityFilters)
                .where({ report_ID: reportExposedId }),
            },
          })
      );

      const filtersMap = new Map();
      for (const f of definedFilters) {
        filtersMap.set(`${f.table}.${f.column}`, f);
      }

      const finalFilters = filters.map((userFilter) => {
        const key = `${userFilter.table}.${userFilter.column}`;
        const def = filtersMap.get(key);

        if (!def) {
          throw new Error(`No filter definition found for ${key}`);
        }

        return {
          $schema: def.schema,
          target: {
            table: userFilter.table,
            column: userFilter.column,
          },
          operator: def.operator,
          values: userFilter.values,
          filterType: 1,
          requireSingleSelection: def.requireSingleSelection,
          displaySettings: {
            isLockedInViewMode: def.displaySetting_isLockedInViewMode,
            isHiddenInViewMode: def.displaySetting_isHiddenInViewMode,
            displayName: def.displaySetting_displayName
          }
        };
      });

      const embedHTML = `
      <div id="reportContainer" style="height:100%;width:100%"></div>
      <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.19.1/dist/powerbi.js"></script>
      <script>
        var models = window['powerbi-client'].models;
        var embedConfiguration = {
          type: 'report',
          tokenType: models.TokenType.Embed,
          accessToken: '${embedToken}',
          embedUrl: '${embedInfo.embedUrl}',
          settings: {
            panes: {
              filters: { visible: true, expanded: true }
            }
          }
        };
        var reportContainer = document.getElementById('reportContainer');
        var report = powerbi.embed(reportContainer, embedConfiguration);

        report.on("loaded", function () {
          const filters = ${JSON.stringify(finalFilters)};
          report.setFilters(filters).catch(function (errors) {
            console.error("Failed to set filters:", JSON.stringify(errors, null, 2));
          });
        });
      </script>
    `;

      return { html: embedHTML };
    } catch (error) {
      console.error(
        "Power BI Embed Error:",
        error?.response?.data || error.message
      );
      req.error(500, "Failed to generate embedded report with filters.");
    }
  });
});
