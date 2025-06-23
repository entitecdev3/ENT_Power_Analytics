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
      var oView = this.getView();
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", false);
      oViewModel.setProperty("/LoginHeader", false);
      oViewModel.setProperty("/HomeScreen", true);

      // Get role data from session storage
      try {
        // Fetch user info using getUserInfo() function import
        const oBindingContext = oView.getModel().bindContext("/getUserInfo()");
        const oUserData = await oBindingContext.requestObject();

        // Optional: store in a reusable model for later (like you do in onProfilePress)
        if (!this._userInfoModel) {
          this._userInfoModel = new sap.ui.model.json.JSONModel(oUserData);
        }

        // Update visibility of tiles based on roles
        const roles = oUserData.roles || {};
        this._setTileVisibility(roles);

      } catch (err) {
        MessageToast.show("Failed to fetch user info");
        console.error("getUserInfo() failed", err);
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
