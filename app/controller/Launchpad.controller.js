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
        this.getCustomData();
        this.getModel("appView").setProperty("/navVisible", false);
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

        if (id === "idUsers") {
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
    });
  });
  