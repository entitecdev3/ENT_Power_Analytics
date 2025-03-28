sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "entitec/pbi/embedding/controller/BaseController"
], function (Controller, MessageToast, BaseController) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Login", {
    onInit: function () {
      // BaseController.prototype.onInit.apply(this);
      this.getRouter()
        .getRoute("Login")
        .attachPatternMatched(this._matchedHandler, this);
    },
    _matchedHandler: function () {
      this.getModel("appView").setProperty("/navVisible", false);
    },
    onButtonLoginPress: function (oEvent) {
      // MessageToast.show("Login logic to be implemented.");
      // Here you can add navigation logic after successful authentication
      var sUsername = this.getView().byId("idUnameInput").getValue();
      var sPassword = this.getView().byId("idPasswordInput").getValue();

      // Validate Inputs
      if (!sUsername || !sPassword) {
        sap.m.MessageToast.show("Please enter username and password");
        return;
      }
      var payload = {
        username: sUsername,
        password: sPassword
      };
      var that = this;
      this.getView().setBusy(true);
      this.middleWare
        .callMiddleWare(`/Login`, "POST", payload)
        .then(function (data, status, xhr) {
          that.getView().setBusy(false);
          that.getRouter().navTo("Apps");
          var oViewModel = that.getView().getModel("appView");
          oViewModel.setProperty("/LoginHeader", false);  // Hide login header
          oViewModel.setProperty("/HomeScreen", true);    // Show home header
          oViewModel.setProperty("/navVisible", false);   // No back button needed at home
        })
        .catch(function (jqXhr, textStatus, errorMessage) {
          that.getView().setBusy(false);
          that.getView().byId("idUnameInput").setValueState("Error");
          that.getView().byId("idPasswordInput").setValueState("Error");
          that.middleWare.errorHandler(jqXhr, that);
        });
    },
    onInputUsernameSubmit: function (oEvent) {

    },
    onInputPasswordSubmit: function () {

    }
  });
});
