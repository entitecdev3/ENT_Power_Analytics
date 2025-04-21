sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/ui/Device"
], function (Controller, MessageToast, BaseController, Device) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Report", {
    onInit: function onInit(oEvent) {
      this._oRouter = this.getOwnerComponent().getRouter();
      this.getRouter()
        .getRoute("Report")
        .attachPatternMatched(this._matchedHandler, this);
    },
    _matchedHandler: function () {
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", true);   // Show back button
      oViewModel.setProperty("/LoginHeader", false);   // Show back button
      oViewModel.setProperty("/HomeScreen", true);   // Show back button
      // this.loadPowerBIReport();
    },

    onReportSelectionChange: function (oEvent) {
      const oSelectedItem = oEvent.getParameter("selectedItem");
      // debugger;
      if (oSelectedItem) {
        // const reportObject = oEvent.getParameter("selectedItem").getBindingContext().getObject();
        const sReportId = oSelectedItem.getKey();
        const sReportText = oSelectedItem.getText();

        // Update the title (optional)
        this.byId("idReportTitle").setText("Report: " + sReportText);
        this.loadPowerBIReport(sReportId)
      }
    },

    loadPowerBIReport: async function (reportExposedId) {
      try {
        const oModel = this.getView().getModel("powerBi");

        const sPath = `/ReportsExposed(${reportExposedId})/getEmbedDetails(...)`;


        const oBinding = oModel.bindContext(sPath);
        // oBinding.setParameter("reportExposedId", reportExposedId);
        await oBinding.execute(); // wait for the action to finish

        const oContext = oBinding.getBoundContext();
        const oResult = oContext.getObject();

        if (oResult && oResult.html) {
          const container = this.byId("embedHTML").getDomRef();
          const containerDoc = container.contentDocument || container.contentWindow.document;
          containerDoc.open();
          containerDoc.write(oResult.html);
          containerDoc.close();
        } else {
          MessageToast.show("No embed HTML received.");
        }

      } catch (error) {
        MessageToast.show("Failed to load Power BI report.");
        console.error("Error in loadPowerBIReport:", error);
      }
    },


  });
});