sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/ui/Device"
], function (Controller, MessageToast, BaseController, Device) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Login", {
    onInit: function () {
      this.getRouter()
        .getRoute("Login")
        .attachPatternMatched(this._matchedHandler, this);
    },
    _matchedHandler: function () {
      this.getModel("appView").setProperty("/navVisible", false);
      this.getModel("appView").setProperty("/LoginHeader", false); 
    },
    onButtonLoginPress: function (oEvent) {
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
          that.getModel().refresh();
          var oViewModel = that.getView().getModel("appView");
          oViewModel.setProperty("/User",data.user);
          sessionStorage.setItem("LoggedInUser", JSON.stringify(data.user));
          oViewModel.setProperty("/LoginHeader", false);  
          oViewModel.setProperty("/HomeScreen", true);    
          oViewModel.setProperty("/navVisible", false);  
          
        })
        .catch(function (jqXhr, textStatus, errorMessage) {
          that.getView().setBusy(false);
          that.getView().byId("idUnameInput").setValueState("Error");
          that.getView().byId("idPasswordInput").setValueState("Error");
          that.middleWare.errorHandler(jqXhr, that);
        });
    },
  });
});
