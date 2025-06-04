sap.ui.define([], function () {
  "use strict";

  return {
    formatRoles: function (roles) {
      if (!roles || roles.length === 0) return "";
      return roles.map(r => r.name).join(", ");
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
    formatSchemaName: function(schema){
      if(schema && schema.includes("basic")){
        return "Basic";
      }else{
        return '';
      }
    }
  };
});
