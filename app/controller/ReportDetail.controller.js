sap.ui.define(
  [
    "entitec/pbi/embedding/controller/BaseController",
    "sap/ui/core/routing/History",
  ],
  function (BaseController, History) {
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
          this.getView().getModel().refresh(); // optional
          const sReportId = oEvent.getParameter("arguments").reportId;
          const oModel = this.getView().getModel("powerBi");

          try {
            const oBinding = oModel.bindContext(
              `/ReportsExposed('${sReportId}')/PowerBiService.getEmbedDetails(...)`
            );

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
