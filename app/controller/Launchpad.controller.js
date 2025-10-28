sap.ui.define(["./BaseController"], function (BaseController) {
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
      await this.setUserInfo();
      const userData = this.getModel("userInfo").getData();
      const source = userData?.referer;
      const redirectUrl = `${source}#/Apps`;
      if (source) {
        window.location.href = redirectUrl;
      }
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", false);
      oViewModel.setProperty("/LoginHeader", false);
      oViewModel.setProperty("/HomeScreen", true);
      try {
        const oBindingContext = oView.getModel().bindContext("/getUserInfo(...)");
        await oBindingContext.execute();
        const oContext = await oBindingContext.getBoundContext();
        const oUserData = oContext.getObject();

        if (!this._userInfoModel) {
          this._userInfoModel = new sap.ui.model.json.JSONModel(oUserData);
        }

        const roles = oUserData.roles || {};
        this._setTileVisibility(roles);

      } catch (err) {
        MessageToast.show("Failed to fetch user info");
        console.error("Failed to fetch user info", err);
        window.location.href = '/';
      }
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
