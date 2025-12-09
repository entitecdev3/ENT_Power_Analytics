sap.ui.define([], function () {
  "use strict";

  return {
    formatRoles: function (roles) {
      if (!roles || roles.length === 0) return "";
      return roles.map((r) => r.name).join(", ");
    },
    formatCompanyDisplay: function (ID, aData) {
      let oCompany = aData?.find((company) => company.ID === ID);
      if (oCompany) {
        return oCompany.name;
      }
      return "";
    },
    formatRoleDisplay: function (ID, aData) {
      let oRoles = aData?.find((role) => role.ID === ID);
      if (oRoles) {
        return oRoles.name;
      }
      return "";
    },
    formatServicePrincipal: function (ID, aData) {
      let oData = aData?.find((role) => role.ID === ID);
      if (oData) {
        return oData.biUser;
      }
      return "";
    },
    formatSchemaName: function (schema) {
      if (schema && schema.includes("basic")) {
        return "Basic";
      } else {
        return "";
      }
    },
    formatSecurityFilters: function (ID, filterData) {
      if (ID && filterData) {
        let oFilter = filterData?.find((filter) => filter.ID === ID);
        if (oFilter) {
          return oFilter.securityUniqueId;
        }
      }
      return "";
    },

    formatLogoutVisibility: function (referer) {
      if (referer) return false;
      else return true;
    },

    showLogo: function (isLogin, isHome, isPhone) {
      // Show logo: on login OR (on home screen and not phone)
      return isLogin || (isHome && !isPhone);
    },

    showVersion: function (isLogin, isPhone) {
      // Show version: only on login and not on phone
      return isLogin && !isPhone;
    },

    isCustomVisible: function (sValueSource) {
      return sValueSource === "custom";
    },

    showCustomValues: function (portalType, valueSource) {
      portalType = portalType || "";
      valueSource = valueSource || "";

      if (portalType === "embed") return true;
      if (portalType === "standalone" && valueSource === "custom") return true;

      return false;
    },

    formatPortalType: function(portalType){
      if(portalType){
        if(portalType === "embed"){
          return 'Embed';
        }else if(portalType === "standalone"){
          return 'Standalone';
        }
      }
    }


  };
});
