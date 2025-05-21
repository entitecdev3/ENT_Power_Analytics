const bcrypt = require("bcryptjs"); // Use bcryptjs instead of bcrypt
const axios = require("axios");

module.exports = cds.service.impl(async function () {
  const { Users, ReportsExposed, PowerBi } = this.entities;

  this.before("CREATE", Users, async (req) => {
    // console.log(req.user);
    if (req.data.password) {
      const saltRounds = 10;
      req.data.password = await bcrypt.hash(req.data.password, saltRounds);
    }
  });

  this.on("getCustomAttrbute", async (req) => {
    const db = srv.tx(req);
    const config = await db.run(
      SELECT.one.from("portal_Power_Analytics_PowerBIPortal_Configuration")
    );
    return config; // Default to 'Guest' if no role found
  });

  this.on("getUserInfo", async (req) => {
    const user = req.user; // cds.User instance injected by CAP runtime from passport session

    if (!user || user.id === "anonymous") {
      req.reject(401, "User not authenticated");
    }

    return {
      username: user.username,
      roles: user.roles || [],
    };
  });

  this.before('UPDATE', Users, async (req) => {
    // console.log(req.user);
    if (req.data.password) {
      const saltRounds = 10;
      req.data.password = await bcrypt.hash(req.data.password, saltRounds);
    }
  });

  this.before('*', async (req) => {
    if (!req.user) {
      req.reject(401, "Session expired. Please log in again.");
    }
  });


  async function getAccessToken(config) {
    const qs = require("querystring");
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

    const params = {
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: "https://analysis.windows.net/powerbi/api/.default",
    };

    const response = await axios.post(tokenUrl, qs.stringify(params), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data.access_token;
  };

  this.on("READ", ReportsExposed, async (req) => {
    // Pull base report records yourself
    const baseReports = await SELECT.from(ReportsExposed).columns(
      "ID",
      "description",
      "reportId",
      "workspaceId",
      "servicePrincipal_ID as servicePrincipal_ID"
    );

    // Fetch configIds (unique Service Principals)
    const configIds = [
      ...new Set(baseReports.map((r) => r.servicePrincipal_ID)),
    ];

    const powerBiData = {};
    for (const configId of configIds) {
      const config = await SELECT.one.from(PowerBi).where({ ID: configId });
      if (!config) continue;

      try {
        const token = await getAccessToken(config);

        // Get Workspaces
        const wsResp = await axios.get(`${config.biApiUrl}v1.0/myorg/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const workspaces = wsResp.data.value;

        // Get Reports per workspace
        const reportsByWorkspaceId = {};
        await Promise.all(
          workspaces.map(async (ws) => {
            const repResp = await axios.get(
              `${config.biApiUrl}v1.0/myorg/groups/${ws.id}/reports`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            reportsByWorkspaceId[ws.id] = repResp.data.value;
          })
        );

        powerBiData[configId] = {
          workspaces,
          reportsByWorkspaceId,
        };
      } catch (err) {
        console.error(
          `Power BI fetch failed for configId ${configId}:`,
          err.message
        );
      }
    }

    // Return enriched reports
    return baseReports.map((r) => {
      const pbi = powerBiData[r.servicePrincipal_ID];
      const workspace = pbi?.workspaces.find((w) => w.id === r.workspaceId);
      const report = pbi?.reportsByWorkspaceId?.[r.workspaceId]?.find(
        (rep) => rep.id === r.reportId
      );

      return {
        ...r,
        servicePrincipal: { ID: r.servicePrincipal_ID }, // Optional
        workspaceName: workspace?.name,
        reportName: report?.name
      };
    });
  });
});
