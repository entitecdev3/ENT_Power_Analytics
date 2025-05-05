const cds = require("@sap/cds");
const axios = require("axios");
const qs = require("qs");

module.exports = cds.service.impl(async function () {
  const { PowerBi, ReportsExposed } = this.entities;

  this.on("getEmbedDetails", async (req) => {
    const db = cds.db;
    const reportExposedId = req.params[0];

    try {

      const reportDetails = await db.run(SELECT.one.from(ReportsExposed).where({ ID: reportExposedId }));
      if (!reportDetails) return req.error(500, "Power BI report details not found!");


      const config = await db.run(SELECT.one.from(PowerBi).where({ ID: reportDetails.servicePrincipal_ID }));
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
          datasetId: embedInfo.datasetId
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
      const matches = url.match(/groups\/([a-zA-Z0-9-]+)\/reports\/([a-zA-Z0-9-]+)/);
      if (!matches || matches.length < 3) {
        return req.reply({ statusCode: 400, message: "Invalid URL format." });
      }
  
      const [_, workspaceId, reportId] = matches;
  
      // Find a valid Service Principal config (assumes one per tenant, customize if needed)
      const config = await cds.db.run(SELECT.one.from(PowerBi));
      if (!config) return req.reply({ statusCode: 500, message: "Power BI configuration not found." });
  
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
  
      return req.reply({ statusCode: 200, message: "Service Principal has access to the report." });
  
    } catch (error) {
      const errMsg = error?.response?.data?.error?.message || error.message;
      console.error("Power BI access check error:", errMsg);
      return req.reply({ statusCode: error?.response?.status || 500, message: `Access failed: ${errMsg}` });
    }
  });
  
});
