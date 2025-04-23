sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/BusyIndicator"
], (BaseController, JSONModel, BusyIndicator) => {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.App", {
    onInit() {
      var oViewModel,
        fnSetAppNotBusy,
        iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
      oViewModel = new JSONModel({
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

      
    },

   

  });
});