sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Launchpad", {
    onInit: function onInit(oEvent) {
      this._oRouter = this.getOwnerComponent().getRouter();
      this.getRouter()
        .getRoute("Apps")
        .attachPatternMatched(this._matchedHandler, this);
    },
    _matchedHandler: function () {
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", false);
      oViewModel.setProperty("/LoginHeader", false);
      oViewModel.setProperty("/HomeScreen", true);

      // Get role data from session storage
      const userInfo = JSON.parse(
        sessionStorage.getItem("LoggedInUser") || "{}"
      );
      const roles = userInfo.roles || {};

      this._setTileVisibility(roles);
    },
    press: function (oEvent) {
      var id = oEvent.getSource().getId().split("--")[
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
      view.byId("idUser").setVisible(isAdmin);

      const oConfigMsgStrip = view.byId("configMsgStrip");
      if (oConfigMsgStrip) {
        oConfigMsgStrip.setVisible(isAdmin);
      }
    },
  });
});
