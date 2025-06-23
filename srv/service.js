const bcrypt = require("bcryptjs"); // Use bcryptjs instead of bcrypt
const axios = require("axios");
const { validate: isUUID } = require('uuid');

function maskSecret(secret) {
  if (!secret || secret.length <= 3) return "***";
  return secret.slice(0, 3) + "*".repeat(secret.length - 3);
}

module.exports = cds.service.impl(async function () {
  const {
    Users,
    ReportsExposed,
    PowerBi,
    ReportsToSecurityFilters,
    SecurityFilters,
    ReportsToRoles,
    Roles,
    MyReports,
  } = this.entities;

  this.before("CREATE", Users, async (req) => {
    // console.log(req.user);
    if (req.data.password) {
      const saltRounds = 10;
      req.data.password = await bcrypt.hash(req.data.password, saltRounds);
    }
  });

  this.on("READ", PowerBi, async (req, next) => {
    let data = await next();

    if (Array.isArray(data)) {
      data.forEach((entry) => {
        if (entry.clientSecret) {
          entry.clientSecret = maskSecret(entry.clientSecret);
        }
      });
    } else if (data && data.clientSecret) {
      data.clientSecret = maskSecret(data.clientSecret);
    }
    return data;
  });

  this.on("READ", MyReports, async (req) => {
    const userInfo = req.user || cds.context.user;
  
    if (!userInfo || !userInfo.id) {
      req.reject(401, "Unauthorized: Missing user info");
      return;
    }
  
    const userId = userInfo.id;
    const db = cds.db;
  
    // Utility: Normalize any structure to lowercase array of strings
    const normalizeRoles = (val) => {
      if (Array.isArray(val)) return val.map(r => r.toLowerCase());
      if (typeof val === 'object' && val !== null) return Object.keys(val).map(r => r.toLowerCase());
      if (typeof val === 'string') return val.split(',').map(r => r.trim().toLowerCase());
      return [];
    };
  
    // Case 1: Traditional login (UUID id)
    if (isUUID(userId)) {
      const user = await SELECT.one
        .from(Users)
        .where({ ID: userId })
        .columns('role_ID');
  
      if (!user || !user.role_ID) {
        req.reject(403, "Forbidden: No role assigned to user");
        return;
      }
  
      const role = await SELECT.one
        .from(Roles)
        .where({ ID: user.role_ID })
        .columns('name');
  
      if (!role || !role.name) {
        req.reject(403, "Forbidden: Role not found");
        return;
      }
  
      const isAdmin = role.name.toLowerCase() === 'admin';
  
      if (isAdmin) {
        return await SELECT
          .from(ReportsExposed)
          .columns('ID', 'workspaceId', 'servicePrincipal_ID', 'externalRoles', 'description');
      }
  
      const subQuery = SELECT
        .from(ReportsToRoles)
        .columns('report_ID')
        .where({ role_ID: user.role_ID });
  
      return await SELECT
        .from(ReportsExposed)
        .where({ ID: { in: subQuery } })
        .columns('ID', 'workspaceId', 'servicePrincipal_ID', 'externalRoles', 'description');
    }
  
    // Case 2: SSO login (non-UUID)
    const userRoles = normalizeRoles(userInfo.roles);          
    const userExternalRoles = normalizeRoles(userInfo.externalRoles); 
  
    const allReports = await SELECT.from(ReportsExposed)
      .columns('ID', 'workspaceId', 'servicePrincipal_ID', 'externalRoles', 'description');
  
    const matched = [];
  
    for (const report of allReports) {
      // Match externalRoles
      if (!report.externalRoles) continue;
  
      const reportExternalRoles = report.externalRoles
        .split(',')
        .map(r => r.trim().toLowerCase());
  
      const matchesExternal = reportExternalRoles.some(r => userExternalRoles.includes(r));
      if (!matchesExternal) continue; // Must match external roles
  
      // Match linked Roles
      const reportRoleLinks = await SELECT.from(ReportsToRoles)
        .where({ report_ID: report.ID })
        .columns('role_ID');
  
      const linkedRoleNames = await SELECT.from(Roles)
        .where({ ID: { in: reportRoleLinks.map(r => r.role_ID) } })
        .columns('name');
  
      const matchesInternal = linkedRoleNames
        .map(r => r.name.toLowerCase())
        .some(name => userRoles.includes(name));
  
      if (matchesInternal) {
        matched.push(report); // ✅ Only if both external & internal matched
      }
    }
  
    return matched;
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
      referer: user.referer
    };
  });

  this.before("UPDATE", Users, async (req) => {
    // console.log(req.user);
    if (req.data.password) {
      const saltRounds = 10;
      req.data.password = await bcrypt.hash(req.data.password, saltRounds);
    }
  });

  this.before("*", async (req) => {
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
  }

  // this.on("READ", ReportsExposed, async (req, next) => {

  //   const data = await next(); // Let CAP handle the DB transaction first
  //   console.log("READ Triggered")
  //   // If there's no reportId/workspaceId, return as-is
  //   if (!data || !data[0]?.reportId || !data[0]?.workspaceId) return data;

  //   const enrichedData = await Promise.all(
  //     data.map(async (report) => {
  //       try {
  //         let config = await SELECT.one
  //           .from(PowerBi)
  //           .where({
  //             ID: report.servicePrincipal?.ID || report.servicePrincipal_ID,
  //           });
  //         if (!config) return report;

  //         const token = await getAccessToken(config);

  //         const [wsResp, repResp] = await Promise.all([
  //           axios.get(`${config.biApiUrl}v1.0/myorg/groups`, {
  //             headers: { Authorization: `Bearer ${token}` },
  //           }),
  //           axios.get(
  //             `${config.biApiUrl}v1.0/myorg/groups/${report.workspaceId}/reports`,
  //             {
  //               headers: { Authorization: `Bearer ${token}` },
  //             }
  //           ),
  //         ]);

  //         const workspaces = wsResp.data.value;
  //         const reports = repResp.data.value;

  //         const workspace = workspaces.find(
  //           (ws) => ws.id === report.workspaceId
  //         );
  //         const matchedReport = reports.find((r) => r.id === report.reportId);

  //         report.workspaceName = workspace?.name || "Unknown Workspace";
  //         report.workspaceUrl = `${
  //           config.tenantUrl || "https://app.powerbi.com"
  //         }/groups/${report.workspaceId}`;
  //         report.reportName = matchedReport?.name || "Unknown Report";
  //         report.reportUrl = `${report.workspaceUrl}/reports/${report.reportId}`;
  //       } catch (err) {
  //         console.error(
  //           `Power BI fetch failed for report ${report.ID}:`,
  //           err.message
  //         );
  //         report.workspaceName = "Error loading workspace";
  //         report.reportName = "Error loading report";
  //       }

  //       return report;
  //     })
  //   );

  //   return enrichedData;
  // });
  this.on("READ", ReportsExposed, async (req, next) => {
    // Ensure $select contains the required fields
    const cols = req.query?.SELECT?.columns || [];
    const requiredFields = ["reportId", "workspaceId", "servicePrincipal_ID"];

    for (const field of requiredFields) {
      const exists = cols.some((col) => col.ref?.[0] === field);
      if (!exists) {
        cols.push({ ref: [field] });
      }
    }

    const data = await next(); // Let CAP handle the DB fetch first
    console.log("READ Triggered");

    // Normalize to array for consistent handling
    const reports = Array.isArray(data) ? data : [data];

    // Check if all reports have required IDs to fetch Power BI data
    const allComplete = reports.every(
      (r) =>
        r.reportId &&
        r.workspaceId &&
        (r.servicePrincipal?.ID || r.servicePrincipal_ID)
    );

    if (!allComplete) {
      console.log(
        "Skipping enrichment — missing reportId/workspaceId or servicePrincipal"
      );
      return data; // Return raw data without enrichment
    }

    const enrichedData = await Promise.all(
      reports.map(async (report) => {
        try {
          const servicePrincipalId =
            report.servicePrincipal?.ID || report.servicePrincipal_ID;

          const config = await SELECT.one
            .from(PowerBi)
            .where({ ID: servicePrincipalId });
          if (!config) return report;

          const token = await getAccessToken(config);

          const [wsResp, repResp] = await Promise.all([
            axios.get(`${config.biApiUrl}v1.0/myorg/groups`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(
              `${config.biApiUrl}v1.0/myorg/groups/${report.workspaceId}/reports`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ),
          ]);

          const workspaces = wsResp.data.value;
          const reportsList = repResp.data.value;

          const workspace = workspaces.find(
            (ws) => ws.id === report.workspaceId
          );
          const matchedReport = reportsList.find(
            (r) => r.id === report.reportId
          );

          report.workspaceName = workspace?.name || "Unknown Workspace";
          report.workspaceUrl = `${config.tenantUrl || "https://app.powerbi.com"
            }/groups/${report.workspaceId}`;
          report.reportName = matchedReport?.name || "Unknown Report";
          report.reportUrl = `${report.workspaceUrl}/reports/${report.reportId}`;
        } catch (err) {
          console.error(
            `Power BI fetch failed for report ${report.ID}:`,
            err.message
          );
          report.workspaceName = "Error loading workspace";
          report.reportName = "Error loading report";
        }

        return report;
      })
    );

    // If the request was for a single record, return a single object
    return Array.isArray(data) ? enrichedData : enrichedData[0];
  });

});




