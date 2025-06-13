sap.ui.define(
  ["entitec/pbi/embedding/controller/BaseController", "sap/ui/model/Filter"],
  function (BaseController, Filter) {
    "use strict";

    return BaseController.extend(
      "entitec.pbi.embedding.controller.ReportList",
      {
        onInit: function () {
          this.getOwnerComponent()
            .getRouter()
            .getRoute("Report")
            .attachPatternMatched(this._onMatched, this);
        },

        _onMatched: async function () {
          const appModel = this.getView().getModel("appView");
          appModel.setProperty("/navVisible", true);
          appModel.setProperty("/LoginHeader", false);
          appModel.setProperty("/HomeScreen", true);
          appModel.setProperty('/subHeaderTitle', 'Reports');

          const oModel = this.getView().getModel();
          const wsModel = this.getView().getModel("powerBi");

          // Load all reports
          // Load all reports (filtered securely by role from backend)
          const aReports = await oModel
            .bindList("/MyReports")
            .requestContexts()
            .then((ctxs) => ctxs.map((ctx) => ctx.getObject()));

          // Group reports by servicePrincipal_ID
          const configToReportsMap = {};
          aReports.forEach((report) => {
            const configId = report.servicePrincipal_ID;
            if (!configToReportsMap[configId]) {
              configToReportsMap[configId] = [];
            }
            configToReportsMap[configId].push(report);
          });

          const wsMap = {}; // workspaceId -> workspaceName

          // For each config, fetch workspaces
          const allWorkspaces = await Promise.all(
            Object.keys(configToReportsMap).map(async (configId) => {
              const wsList = await wsModel
                .bindList("/LiveWorkspaces")
                .filter(new Filter("configId", "EQ", configId))
                .requestContexts()
                .then((ctxs) => ctxs.map((ctx) => ctx.getObject()));
              wsList.forEach((ws) => {
                wsMap[ws.id] = ws.name;
              });
            })
          );

          // Group all reports by workspace name
          const groupedByWorkspace = {};
          aReports.forEach((r) => {
            const wsName = wsMap[r.workspaceId] || "Unknown Workspace";
            if (!groupedByWorkspace[wsName]) {
              groupedByWorkspace[wsName] = [];
            }
            groupedByWorkspace[wsName].push(r);
          });

          // Convert to structured array
          const structuredTiles = [];
          for (const wsName in groupedByWorkspace) {
            structuredTiles.push({
              isHeader: true,
              name: wsName,
              tiles: groupedByWorkspace[wsName].map((r) => ({
                ...r,
                isHeader: false,
              })),
            });
          }

          // Set to view model
          const localModel = new sap.ui.model.json.JSONModel({
            tiles: structuredTiles,
          });
          this.getView().setModel(localModel, "local");
        },

        onTilePress: function (oEvent) {
          const oTile = oEvent.getSource();
          const sReportId = oTile
            .getCustomData()
            .find((d) => d.getKey() === "reportId")
            .getValue();
          const sDescripiton = oTile.getHeader();
          const appModel = this.getView().getModel("appView");
          appModel.setProperty("/selectedReport", {
            description: sDescripiton,
          });
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("ReportDetail", {
            reportId: sReportId,
          });
        },
      }
    );
  }
);
