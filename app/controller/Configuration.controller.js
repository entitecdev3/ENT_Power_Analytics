sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (Controller, MessageToast, BaseController, MessageBox, Fragment) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Configuration", {
    onInit: function onInit(oEvent) {
      this._oRouter = this.getOwnerComponent().getRouter();
      this.getRouter()
        .getRoute("Configuration")
        .attachPatternMatched(this._matchedHandler, this);
    },
    _matchedHandler: function () {
      // // this.getCustomData();;
      this.getServicePrincipals();
      this.getModel("appView").setProperty("/navVisible", true);
    },
    getServicePrincipals: function () {
      var that = this;
      this.middleWare.callMiddleWare("/ServicePrincipals", "GET")
        .then(function (data) {
          that.getModel().setProperty("/ServicePrincipals", data);
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    getReportsExposed: function () {
      var that = this;
      this.middleWare.callMiddleWare("/ReportsExposed", "GET")
        .then(function (data) {
          that.getModel().setProperty("/ReportsExposed", data);
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    getSecurityFilters: function () {
      var that = this;
      this.middleWare.callMiddleWare("/SecurityFilters", "GET")
        .then(function (data) {
          that.getModel().setProperty("/SecurityFilters", data);
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    onAddServicePrincipalConfiguration: function () {
      var that = this;
      var oView = this.getView();
      this.addServicePrincipal = true;
      this.getView().getModel().setProperty("/addServicePrincipal", this.addServicePrincipal);
        if (!this.ServicePrincipalConfiguration) {
          this.ServicePrincipalConfiguration = Fragment.load({
            id: oView.getId(),
            name: "entitec.pbi.embedding.fragments.EditServicePrincipalConfiguration",
            controller: this
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.ServicePrincipalConfiguration.then(async function (oDialog) {
          let ServicePrincipalObject = {
            BIACCOUNTUSER: null,
            PASSWORD: null,
            AUTHORITY_URL: null,
            SCOPE_BASE: null,
            POWERBI_API_URL: null,
            CLIENT_ID: null,
            CLIENT_SECRET: null,
            TENANT_ID: null,
            IDENTITY_ID: null,
            REPORTS_EXPOSED_ID: null,
          }
          that.getView().getModel().setProperty("/servicePrincipalObject", ServicePrincipalObject);
          oDialog.open();
        });
    },
    // onAddServicePrincipalConfiguration:function(){

    // },
    // onAddServicePrincipalConfiguration:function(){

    // },

  });
});
