sap.ui.define(
  ["entitec/pbi/embedding/controller/BaseController", "sap/ui/Device"],
  function (BaseController, Device) {
    "use strict";

    return BaseController.extend(
      "entitec.pbi.embedding.controller.ReportDetail",
      {
        onInit: function () {
          this._oRouter = this.getOwnerComponent().getRouter();
          this.getRouter()
            .getRoute("ReportDetail")
            .attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: async function (oEvent) {
          const oViewModel = this.getView().getModel("appView");
          oViewModel.setProperty("/navVisible", true);
          oViewModel.setProperty("/LoginHeader", false);
          oViewModel.setProperty("/HomeScreen", true);
          oViewModel.setProperty(
            "/subHeaderTitle",
            oViewModel.getProperty("/selectedReport/description")
          );
          this.getView().getModel().refresh(); // optional
          const sReportId = oEvent.getParameter("arguments").reportId;
          const oModel = this.getView().getModel("powerBi");
          let sDeviceType = "desktop";
          if (
            sap.ui.Device.system.phone &&
            sap.ui.Device.orientation.landscape
          ) {
            sDeviceType = "phone_landscape";
          } else if (sap.ui.Device.system.phone) {
            sDeviceType = "phone";
          } else if (sap.ui.Device.system.tablet) {
            sDeviceType = "tablet";
          }

          try {
            const oBinding = oModel.bindContext(
              `/ReportsExposed('${sReportId}')/PowerBiService.getEmbedDetails(...)`
            );
            oBinding.setParameter("deviceType", sDeviceType);

            await oBinding.execute(); // Executes the function call

            const oContext = oBinding.getBoundContext();
            const oResult = oContext.getObject();

            if (oResult && oResult.html) {
              const iframe = this.byId("embedHTML").getDomRef();
              const doc =
                iframe.contentDocument || iframe.contentWindow.document;
              doc.open();
              doc.write(oResult.html);
              doc.close();
            } else {
              MessageToast.show("No HTML returned from Power BI service.");
            }
          } catch (err) {
            MessageToast.show("Failed to load Power BI report.");
            console.error("Error in _onPatternMatched:", err);
          }
        },
      }
    );
  }
);
