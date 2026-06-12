sap.ui.define(["./BaseController", "sap/m/MessageToast"], function (BaseController, MessageToast) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Launchpad", {
    onInit: function onInit(oEvent) {
      this._oRouter = this.getOwnerComponent().getRouter();
      this.getRouter()
        .getRoute("Apps")
        .attachPatternMatched(this._matchedHandler, this);
    },
    _matchedHandler: async function () {
      const oView = this.getView();
      if ( ! this.getOwnerComponent().getModel("userInfo")?.getProperty("/username")) {
        await this.setUserInfo();
      }  
      const userData = this.getOwnerComponent().getModel("userInfo")?.getData();
      const source = userData?.referer;
      const redirectUrl = `${source}#/Apps`;
      if (source) {
        document.activeElement.blur();
        window.location.href = redirectUrl;
      }
      let oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", false);
      oViewModel.setProperty("/LoginHeader", false);
      oViewModel.setProperty("/HomeScreen", true);
      const roles = userData?.roles || {};
      if(roles){
        this._setTileVisibility(roles);
      }
    },
    press: function (oEvent) {
      let id = oEvent.getSource().getId().split("--")[
        oEvent.getSource().getId().split("--").length - 1
      ];

      if (id === "idServicePrincipal") {
        this._oRouter.navTo("ServicePrincipalConfiguration");
      }

      if (id === "idConfiguration") {
        this._oRouter.navTo("Configuration");
      }

      if (id === "idUser") {
        this._oRouter.navTo("Users");
      }

      if (id === "idAdministration") {
        this._oRouter.navTo("Administration");
      }

      if (id === "idReport") {
        this._oRouter.navTo("Report");
      }
    },
    visibleFunc: function (value) {
      var oConfig = this.getModel("config").getJSON();
      oConfig = JSON.parse(oConfig);
      if (oConfig.hiddenTiles) {
        return false;
      }

      return true;
    },
    _setTileVisibility: function (roles) {
      const view = this.getView();

      // All users see Reports
      view.byId("idReport").setVisible(true);

      // Admin-only tiles
      const isAdmin = roles.Admin === 1;

      view.byId("idConfiguration").setVisible(isAdmin);
      view.byId("idAdministration").setVisible(isAdmin);

      const oConfigMsgStrip = view.byId("configMsgStrip");
      if (oConfigMsgStrip) {
        oConfigMsgStrip.setVisible(isAdmin);
      }
    },
  });
});
