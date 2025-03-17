sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "entitec/pbi/embedding/controller/BaseController"
  ], function (Controller, MessageToast, BaseController) {
    "use strict";
  
    return BaseController.extend("entitec.pbi.embedding.controller.Report", {
      onInit: function onInit(oEvent) {
        this._oRouter = this.getOwnerComponent().getRouter();
        this.getRouter()
          .getRoute("Report")
          .attachPatternMatched(this._matchedHandler, this);
      },
      _matchedHandler: function () {
        this.getCustomData();
        this.getModel("appView").setProperty("/navVisible", true);
      }
  
    });
  });