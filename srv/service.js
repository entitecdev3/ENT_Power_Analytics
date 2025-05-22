const bcrypt = require("bcryptjs"); // Use bcryptjs instead of bcrypt
const axios = require("axios");

module.exports = cds.service.impl(async function () {
  const { Users, ReportsExposed, PowerBi, ReportsToSecurityFilters, SecurityFilters } = this.entities;

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
      scope: config.scopeBase,
    };

    const response = await axios.post(tokenUrl, qs.stringify(params), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data.access_token;
  };

  this.on("READ", ReportsExposed, async (req,next) => {
  const data = await next();
  const baseReports=data;

  for (const report of baseReports) {
    let config = await SELECT.one.from(PowerBi).where({ ID: report.servicePrincipal.ID });
    if (!config)
      config = await SELECT.one.from(PowerBi).where({ ID: report.servicePrincipal_ID });
      if(!config) continue;

    try {
      const token = await getAccessToken(config);

      const wsResp = await axios.get(`${config.biApiUrl}v1.0/myorg/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const workspaces = wsResp.data.value;
      const workspace = workspaces.find(ws => ws.id === report.workspaceId);
      const repResp = await axios.get(`${config.biApiUrl}v1.0/myorg/groups/${report.workspaceId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      const reports = repResp.data.value;
      const matchedReport = reports.find(r => r.id === report.reportId);

      report.workspaceName = workspace?.name || "Unknown Workspace";
      report.workspaceUrl = `${config.tenantUrl || "https://app.powerbi.com"}/groups/${report.workspaceId}`;
      report.reportName = matchedReport?.name || "Unknown Report";
      report.reportUrl = `${report.workspaceUrl}/reports/${report.reportId}`;

    } catch (err) {
      console.error(`Power BI fetch failed for report ${report.ID}:`, err.message);
      report.reportName = "Error loading report";
      report.workspaceName = "Error loading workspace";
    }
    }
    return baseReports;
  });
});

  // Step 6: Enrich and return base reports with nested filters & Power BI data
  // return baseReports.map(r => {
  //   const pbi = powerBiData[r.servicePrincipal_ID];
  //   const workspace = pbi?.workspaces.find(w => w.id === r.workspaceId);
  //   const report = pbi?.reportsByWorkspaceId?.[r.workspaceId]?.find(rep => rep.id === r.reportId);

  //   return {
  //     ...r,
  //     // servicePrincipal: { ID: r.servicePrincipal_ID },
  //     workspaceName: workspace?.name,
  //     reportName: report?.name,
  //     workspaceUrl: workspace ? `${pbi.tenantUrl}/groups/${workspace.id}` : "",
  //     reportUrl: report && workspace ? `${pbi.tenantUrl}/groups/${workspace.id}/reports/${report.id}` : "",
  //     // securityFilters: filtersByReportId[r.ID] || []
  //   };




//  this.on('READ', ReportsExposed, async (req, next) => {
//     // Example logic
//     const data = await next();
//     // each.reportName = await getReportNameFromPowerBI(reportId);
//     // each.workspaceName = await getWorkspaceNameFromPowerBI(workspaceId);
//     // each.reportUrl = `https://app.powerbi.com/reports/${each.reportName}`;
//     // each.workspaceUrl = `https://app.powerbi.com/groups/${each.workspaceName}`;

//     for (const row of data) {
//       row.reportName = await getReportNameFromPowerBI(row.reportId);
//       row.workspaceName = await getWorkspaceNameFromPowerBI(row.workspaceId);
//       row.reportUrl = `https://app.powerbi.com/groups/${row.workspaceId}/reports/${row.reportId}`;
//       row.workspaceUrl = `https://app.powerbi.com/groups/${row.workspaceId}`;
//     }

//   return data;
//   });

//   async function getReportNameFromPowerBI(reportId) {
//     // Call your Power BI API or mapping logic
//     return 'Sample Report';
//   }

//   async function getWorkspaceNameFromPowerBI(workspaceId) {
//     return 'Sample Workspace';
  // }
// });
