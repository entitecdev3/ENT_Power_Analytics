const cds = require("@sap/cds");
const axios = require("axios");
const qs = require("qs");

module.exports = cds.service.impl(async function () {
  const { PowerBi, ReportsExposed, LiveWorkspaces } = this.entities;
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
                filters: { visible: false }
              }
            }
          };
          var reportContainer = document.getElementById('reportContainer');
          powerbi.embed(reportContainer, embedConfiguration);
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
});
