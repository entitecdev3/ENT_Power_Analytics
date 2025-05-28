sap.ui.define([], function () {
  "use strict";

  return {
    formatRoles: function (roles) {
      if (!roles || roles.length === 0) return "";
      return roles.map(r => r.name).join(", ");
    },
    formatCompanyDisplay: async function (ID) {
      const oModel = this.getView().getModel();
      const oBinding = oModel.bindList("/Companies");

      const aContexts = await oBinding.requestContexts(0, 1000); // fetch up to 1000 companies
      const aData = aContexts.map(oContext => oContext.getObject());
      let oCompany = aData.find((company) => company.ID === ID);
      if (oCompany) {
        return oCompany.name;
      }
      return "";
    },
    formatRoleDisplay: async function (ID) {
      const oModel = this.getView().getModel();
      const oBinding = oModel.bindList("/Roles");

      const aContexts = await oBinding.requestContexts(0, 1000); // fetch up to 1000 companies
      const aData = aContexts.map(oContext => oContext.getObject());
      let oRoles = aData.find((role) => role.ID === ID);
      if (oRoles) {
        return oRoles.name;
      }
      return "";
    },
    formatDisplaySetting : async function (ID) {
      const oModel = this.getView().getModel();
      const oBinding = oModel.bindList("/DisplaySettings");

      const aContexts = await oBinding.requestContexts(0, 1000); // fetch up to 1000 display settings
      const aData = aContexts.map(oContext => oContext.getObject());
      let oSetting = aData.find((setting) => setting.ID === ID);
      if (oSetting) {
        return `${oSetting.property} :${oSetting.value}`;
      }
      return "";
    }
  };
});
