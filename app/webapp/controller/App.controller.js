sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/BusyIndicator"
], (BaseController, JSONModel, BusyIndicator) => {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.App", {
    onInit : async function() {
      let oViewModel,
        fnSetAppNotBusy,
        iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
      oViewModel = new JSONModel({
        User: {},
        busy: true,
        delay: 0,
        LoginHeader: true,  // Initially show login header
        HomeScreen: false,  // Hide home header at login
        navVisible: false   // Back button visibility
      });
      this.setModel(oViewModel, "appView");
      fnSetAppNotBusy = function () {
        oViewModel.setProperty("/busy", false);
        oViewModel.setProperty("/delay", iOriginalBusyDelay);
      };
      $(document).ajaxStart(function (x, y, z) {
        BusyIndicator.show(0);
      });

      $(document).ajaxStop(function (x, y, z) {
        BusyIndicator.hide();
      });
      let sUser = sessionStorage.getItem("LoggedInUser");
      if (sUser) {
        this.getModel("appView").setProperty("/User", JSON.parse(sUser));
      }

      let userInfoModel = this.getModel("userInfo");
      if( this.getRouter().getHashChanger().getHash() && !userInfoModel?.getProperty('/username')){
        await this.setUserInfo();
      }

      let selectedTheme = sessionStorage.theme
          ? sessionStorage.theme
          : "sap_horizon";
        sap.ui.getCore().applyTheme(selectedTheme);

    },
  });
});