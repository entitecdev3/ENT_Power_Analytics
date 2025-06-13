sap.ui.define(
  [
    "sap/m/MessageToast",
    "entitec/pbi/embedding/controller/BaseController",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Context",
  ],
  function (MessageToast, BaseController, MessageBox, Fragment, Context) {
    "use strict";

    return BaseController.extend(
      "entitec.pbi.embedding.controller.Configuration",
      {
        onInit: function () {
          this._oRouter = this.getOwnerComponent().getRouter();
          this._oRouter
            .getRoute("Configuration")
            .attachPatternMatched(this._matchedHandler, this);
        },
        _matchedHandler: function () {
          let oViewModel = this.getView().getModel("appView");
          oViewModel.setProperty("/navVisible", true);
          oViewModel.setProperty("/LoginHeader", false);
          oViewModel.setProperty("/HomeScreen", true);
          oViewModel.setProperty('/visSaveButton', false);
          oViewModel.setProperty('/visDiscardButton', false);
          this.getModel().refresh();

          this.getCallData(oViewModel, this.getView().getModel("powerBi"), "/PowerBi", "/ServicePrincipalData");
          this.getCallData(oViewModel, this.getView().getModel(), "/SecurityFilters", "/SecurityFilters");
          this.getCallData(oViewModel, this.getView().getModel(), "/AssignableRoles", "/AssignableRoles");
        },
        //------------- Service Principal Configuration ------------------

        onAddServicePrincipalConfiguration: function () {
          this.addServicePrincipal = true;
          this.getView().getModel('appView').setProperty('/visClientSecret', true);
          let oContext = this.byId("idConfigTable")
            .getBinding("items")
            .create({}, true, { groupId: "ServicePrincipalChanges" });
          this.openConfigDialog("Add Service Principal", "Add", oContext);
        },
        onConfigSelect: async function (oEvent) {
          this.addServicePrincipal = false;
          let oSource = oEvent.getSource(), oContext = oSource.getBindingContext();
          this.getView().getModel('appView').setProperty('/visClientSecret', oContext.isTransient()? true : false );
          this._selectedServicePrincipalObject = JSON.parse(
            JSON.stringify(oContext.getObject())
          );
          this.openConfigDialog(
            "Edit Service Principal",
            "Update",
            oSource.getBindingContext()
          );
        },
        openConfigDialog: function (title, button, oContext) {
          let oView = this.getView();
          if (!this._oDialog) {
            this._oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "entitec.pbi.embedding.fragments.EditServicePrincipalConfiguration",
              this
            );
            oView.addDependent(this._oDialog);
          }
          this._oDialog.setBindingContext(oContext);
          this._oDialog.setTitle(title);
          // this.byId("idAddConfig").setText(button);
          this._oDialog.open();
        },
        onDeleteConfig: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();

          if (!oContext) {
            MessageToast.show("No Service Principal selected for deletion.");
            return;
          }

          MessageBox.confirm(
            "Are you sure you want to delete this Service Principal?",
            {
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              onClose: function (sAction) {
                if (sAction === MessageBox.Action.OK) {
                  oContext.delete("ServicePrincipalChanges");
                  this.visSaveDiscardButton("ServicePrincipalChanges")
                }
              }.bind(this),
            }
          );
        },
        onRefreshServicePrincipal: function () {
          var that = this;
          let oModel = this.getView().getModel();
          if (oModel.hasPendingChanges()) {
            this.showDiscardChangesWarning(
              "Are you sure you want to reload. Your changes will be lost?",
              null,
              oModel,
              "ServicePrincipalChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idConfigTable"
            );
          } else {
            oModel.resetChanges("ServicePrincipalChanges");
            oModel.refresh();
            this.onChangeHighlightTableRow("idConfigTable"); // Changing the status of the table row
          }
        },
        onSaveEditServicePrincipalDialog: async function () {
          let oContext = this._oDialog.getBindingContext();
          let userObject = oContext.getObject();
          let validated = await this._validateSPFields(userObject);
          if (!validated) {
            return;
          }
          this._oDialog.close();
          if (this.getView().getModel().hasPendingChanges('ServicePrincipalChanges')) {
            this.visSaveDiscardButton('ServicePrincipalChanges');
            this.onChangeHighlightTableRow("idConfigTable"); // Changing the status of the table row
          }
        },
        _validateSPFields: async function (userObject) {
          const isValid = await this.validateEntityFields(
            "PowerBi",
            userObject
          );

          if (!isValid) return false;
          return true;
        },
        onCloseEditServicePrincipalDialog: function (oEvent) {
          let oContext = oEvent.getSource().getBindingContext();

          if (
            oContext?.hasPendingChanges("ServicePrincipalChanges") &&
            !oContext.isTransient()
          ) {
            Object.keys(this._selectedServicePrincipalObject).forEach((key) => {
              if(key.includes("isTransient")) return;
              oContext.setProperty(
                key,
                this._selectedServicePrincipalObject[key]
              );
            });
          } else {
            if (oContext?.isTransient()) {
              oContext.delete();
            }
          }
          this.onChangeHighlightTableRow("idConfigTable"); // Changing the status of the table row
          this._oDialog.close();
        },
        //------------- Reports Exposed Configuration ------------------

        onAddReportsConfiguration: function () {
          this.addReport = true;
          let oView = this.getView();

          // Create a new empty entry with default values
          const oNewReport = {
            ReportsExposed: {
              reportId: "",
              workspaceId: "",
              description: "",
              servicePrincipal_ID: "",
            },
          };

          // Create a temporary model for the dialog
          const oTempModel = new sap.ui.model.json.JSONModel(oNewReport);
          oView.setModel(oTempModel, "tempReport");

          let oNewContext = new Context(oTempModel, "/ReportsExposed");
          this.openReportsConfigDialog("Add Report", "Add", oNewContext);
        },
        onReportSelect: async function (oEvent) {
          this.addReport = false;
          let oView = this.getView();
          let oSelectedContext = oEvent.getSource().getBindingContext();
          this._oSelectedReportContext = oSelectedContext; // store globally

          const oNewReport = { ReportsExposed: oSelectedContext.getObject() };

          const oTempModel = new sap.ui.model.json.JSONModel(oNewReport);
          oView.setModel(oTempModel, "tempReport");

          let oNewContext = new Context(oTempModel, "/ReportsExposed");
          this.openReportsConfigDialog("Edit Report", "Update", oNewContext);

          this.byId("idServicePrincipalTypeInput").fireChange();
          // checked the sercurity filter combo box on select
          let oSecurityFilterCombo = oSelectedContext.getObject().securityFilters?.map((filter) => filter.filter_ID) || []
          this.byId("idSecurityFilters").setSelectedKeys(oSecurityFilterCombo);

          let oAssignableRolesCombo = oSelectedContext.getObject().roles?.map((role) => role.role_ID) || []
          this.byId("idRoles").setSelectedKeys(oAssignableRolesCombo);

          let aExternalRoles = oSelectedContext.getObject().externalRoles?.split(','), oExternalRoles = [];
          if(aExternalRoles && aExternalRoles.length > 0){
            aExternalRoles.forEach((token)=>{
              oExternalRoles.push({text: token});
            })
          }
          if(oExternalRoles && oExternalRoles.length > 0){
            oTempModel.setProperty('/ReportsExposed/tokens', oExternalRoles)
          }
          
        },
        openReportsConfigDialog: function (title, button, oContext) {
          let oView = this.getView();
          if (!this._oReportDialog) {
            this._oReportDialog = sap.ui.xmlfragment(
              oView.getId(),
              "entitec.pbi.embedding.fragments.EditReportsExposedConfiguration",
              this
            );
            oView.addDependent(this._oReportDialog);
          }

          this._oReportDialog.setTitle(title);
          // this.byId("idAddReports").setText(button);
          this._oReportDialog.setBindingContext(oContext);
          this._oReportDialog.open();
        },
        onSecurityFilterSelection: function (oEvent) {
          let aSelectedKeys = oEvent.getSource().getSelectedKeys(), filterArray = [];
          if (aSelectedKeys.length !== 0) {
            aSelectedKeys.forEach((key)=>{
                filterArray.push({"filter_ID": key})
            })
          }
          oEvent.getSource().getModel("tempReport").setProperty("/ReportsExposed/securityFilters", filterArray);
        },
        onInternalRoleSelection: function (oEvent) {
          let aSelectedKeys = oEvent.getSource().getSelectedKeys(), filterArray = [];
          if (aSelectedKeys.length !== 0) {
            aSelectedKeys.forEach((key)=>{
                filterArray.push({"role_ID": key})
            })
          }
          oEvent.getSource().getModel("tempReport").setProperty("/ReportsExposed/roles", filterArray);

        },
        onFreeTextSubmitRoles: function (oEvent) {
          const oMultiInput = oEvent.getSource();
          const sEnteredValue = oEvent.getParameter("value")?.trim();
          if (!sEnteredValue) return;
          const oModel = oMultiInput.getModel("tempReport");
          let aTokens = oModel.getProperty("/ReportsExposed/tokens") || [];

          if (!aTokens.find((token) => token.text === sEnteredValue)) {
            aTokens.push({ text: sEnteredValue });
            oModel.setProperty("/ReportsExposed/tokens", aTokens);
          }

          oMultiInput.setValue(""); // Clear input after submit
        },
        onExternalRoleUpdate : function (oEvent){
          const oMultiInput = oEvent.getSource();
          const oModel = oMultiInput.getModel("tempReport");
          const sPath = "/ReportsExposed/tokens";
          let aTokens = oMultiInput
            .getTokens()
            .map((t) => ({ text: t.getText() }));
          // check type
          let type = oEvent.getParameter('type')
          if(type === 'removed'){
            let tok = oEvent.getParameter('removedTokens'), removeText = tok[0].getText();
            aTokens = aTokens.filter(obj => obj.text !== removeText);
          }
          // Keep only remaining tokens
          oModel.setProperty(sPath, aTokens);
        },
        onSaveEditReportsDialog: async function () {
          let oContext = this._oReportDialog.getBindingContext(), oModel = this.getView().getModel();
          let reportObject = this._oReportDialog
            .getModel("tempReport")
            .getProperty("/ReportsExposed");
          let validated = await this._validateReportFields(reportObject, ['roles', 'externalRoles']);
          if (!validated) return;

          const oTable = this.byId("idRCConfigTable").getBinding("items");

          // Remove the token parts from the data object
          if(reportObject?.tokens){
            let aTokenTexts = reportObject?.tokens?.map((t) => t.text);
            if(aTokenTexts && aTokenTexts.length > 0){
              reportObject.externalRoles = aTokenTexts.join(", ");
            }
            delete reportObject.tokens;
          }
          if (this.addReport) {
            this.aReportCreateContext = oTable.create(reportObject);
          } else if (this._oSelectedReportContext) {
            let oModel = this.getView().getModel();
            let sPath = "/ReportsExposed(" + this._oSelectedReportContext.getObject().ID + ")";
            
            const nonPrimitiveValueEdit = async function (property, newData){
              let oContextBinding = oModel.bindList(`${sPath}/${property}`, null, [], [], {
                $$updateGroupId: "ReportsChanges"
              })
              // Security Filter Edit Part
              await oContextBinding.requestContexts().then((oData) => {
                if(oData && oData.length > 0) {
                  oData.forEach((oContext)=>{
                    oContext?.delete("ReportsChanges")
                  })
                }
              })
              if (newData && newData.length > 0) {
                await newData?.forEach((data)=>{
                  oContextBinding.create(data, {
                    groupId: "ReportsChanges",
                  })
                })
              } 
            }
            await nonPrimitiveValueEdit('securityFilters', reportObject.securityFilters)
            await nonPrimitiveValueEdit('roles', reportObject.roles)
            // Roles Edit Part
            Object.keys(reportObject).forEach((key) => {
              if(key === "securityFilters" || key === 'roles') return; 
              this._oSelectedReportContext.setProperty(key, reportObject[key]);
            });
          }
          if(this.getView().getModel().hasPendingChanges("ReportsChanges")) {
            this.onChangeHighlightTableRow('idRCConfigTable');
            this.visSaveDiscardButton('ReportsChanges')
          }
          this._oReportDialog.close();
          this._oReportDialog.destroy();
          this._oReportDialog = null;
        },
        _validateReportFields: async function (reportObject, skipField) {
          const isValid = await this.validateEntityFields(
            "ReportsExposed",
            reportObject,
            skipField
          );

          if (!isValid) return false;
          return true;
        },
        onCloseEditReportsDialog: function () {
          let oModel = this.getView().getModel();
          // oModel.resetChanges("ReportsChanges");
          this._oReportDialog.close();
          this._oReportDialog.destroy();
          this._oReportDialog = null;
        },
        onDeleteReport: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();

          if (!oContext) {
            MessageToast.show("No Report selected for deletion.");
            return;
          }

          MessageBox.confirm("Are you sure you want to delete this Report?", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                oContext.delete("ReportsChanges");
                this.visSaveDiscardButton('ReportsChanges')
              }
            }.bind(this),
          });
        },
        onRefreshReports: function () {
          let oModel = this.getView().getModel(), that = this;
          if (oModel.hasPendingChanges('ReportsChanges')) {
            MessageBox.warning(
              "Are you sure you want to reload. Your changes will be lost?",
              {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                  if (sAction === MessageBox.Action.OK) {
                    oModel.resetChanges("ReportsChanges");
                    oModel.refresh();
                    that.visSaveDiscardButton('ReportsChanges');
                  }
                },
              }
            );
          } else {
            oModel.resetChanges("ReportsChanges");
            oModel.refresh();
          }
        },
        onLoadReport: async function (oEvent) {
          this._oSelectedReport = oEvent
            .getSource()
            .getBindingContext()
            .getObject();

          const reportId = this._oSelectedReport.ID;
          const oModel = this.getView().getModel("powerBi");

          const sPath = `/ReportsExposed(${reportId})/PowerBiService.getFilterFieldsForReport(...)`;

          const oBinding = oModel.bindContext(sPath);
          // No parameters? No need to set. Otherwise:
          // oBinding.setParameter("reportID", reportId);

          try {
            await oBinding.execute();
            const oData = oBinding.getBoundContext().getObject();

            if (Array.isArray(oData.value) && oData.value.length > 0) {
              this._openDynamicFilterDialog(oData.value); // Pass the filter fields to dialog
            } else {
              MessageToast.show("No security filters defined for this report.");
            }
          } catch (err) {
            MessageBox.error("Failed to fetch filter fields: " + err.message);
          }
        },
        _openDynamicFilterDialog: function (aFilterFields) {
          const aFields = aFilterFields.map((f) => ({
            ...f,
            tokens: [],
            value: "",
          }));

          const oModel = new sap.ui.model.json.JSONModel({
            fields: aFields,
          });
          this.getView().setModel(oModel, "filters");
          if (!this._pFilterDialog) {
            this._pFilterDialog = Fragment.load({
              id: this.getView().getId(),
              name: "entitec.pbi.embedding.fragments.DynamicFilterDialog",
              controller: this,
            }).then((oDialog) => {
              this.getView().addDependent(oDialog);
              return oDialog;
            });
          }

          this._pFilterDialog.then((oDialog) => oDialog.open());
        },
        onCloseFilterDialog: function (oEvent) {
          oEvent.getSource().getParent().close();
        },
        _onSubmitSecurityFilters: function () {
          const oDialog = this.byId("dynamicFilterDialog");
          
          oDialog.close();
          this._applyFiltersAndEmbedReport();
        },
        onTokenUpdate: function (oEvent) {
          const oMultiInput = oEvent.getSource();
          const oContext = oMultiInput.getBindingContext("filters");
          const oModel = oMultiInput.getModel("filters");
          const sPath = oContext.getPath() + "/tokens";

          // Keep only remaining tokens
          let aTokens = oMultiInput
            .getTokens()
            .map((t) => ({ text: t.getText() }));

          let type = oEvent.getParameter('type')
          if(type === 'removed'){
            let token = oEvent.getParameter('removedTokens'), removeText = token[0].getText();
            aTokens = aTokens.filter(obj => obj.text !== removeText);
          }
          oModel.setProperty(sPath, aTokens);
        },
        // onFreeTextSubmit: function (oEvent) {
        //   const oMultiInput = oEvent.getSource();
        //   const sEnteredValue = oEvent.getParameter("value")?.trim();
        //   if (!sEnteredValue) return;

        //   const oContext = oMultiInput.getBindingContext("filters");
        //   const oModel = oMultiInput.getModel("filters");
        //   const sPath = oContext.getPath() + "/tokens";

        //   let aTokens = oModel.getProperty(sPath) || [];
        //   debugger;
        //   // Avoid duplicates
        //   if (!aTokens.find((token) => token.text === sEnteredValue)) {
        //     aTokens.push({ text: sEnteredValue });
        //     oModel.setProperty(sPath, aTokens);
        //   }

        //   oMultiInput.setValue(""); // Clear input after submit
        // },

        onFreeTextSubmit: function (oEvent) {
          const oMultiInput = oEvent.getSource();
          const sEnteredValue = oEvent.getParameter("value")?.trim();
          if (!sEnteredValue) return;

          const oContext = oMultiInput.getBindingContext("filters");
          const oModel = oMultiInput.getModel("filters");
          const sBasePath = oContext.getPath();

          let aTokens = oModel.getProperty(sBasePath + "/tokens") || [];

          if (!aTokens.find((token) => token.text === sEnteredValue)) {
            aTokens.push({ text: sEnteredValue });
            oModel.setProperty(sBasePath + "/tokens", aTokens);

            // Also update the value field as array of texts
            const aTokenTexts = aTokens.map((t) => t.text);
            oModel.setProperty(sBasePath + "/value", aTokenTexts);
          }

          oMultiInput.setValue(""); // Clear input after submit
        },

        _applyFiltersAndEmbedReport: async function () {
          const oFiltersModel = this.getView().getModel("filters");
          const aFilterFields = oFiltersModel.getProperty("/fields");
          const reportId = this._oSelectedReport.ID;
          debugger;
          const aFiltersPayload = aFilterFields.map((f) => ({
            table: f.table,
            column: f.column,
            values: Array.isArray(f.value)
              ? f.value
              : typeof f.value === "string"
              ? f.value.split(",").map((v) => v.trim())
              : [],
          }));

          const oModel = this.getView().getModel("powerBi");

          const sFunctionPath = `/ReportsExposed(${reportId})/PowerBiService.embedReportWithFiltersAuto(...)`;

          const oBinding = oModel.bindContext(sFunctionPath);
          oBinding.setParameter("filters", aFiltersPayload);

          try {
            await oBinding.execute();
            const oResult = oBinding.getBoundContext().getObject();

            if (oResult && oResult.html) {
              const oDialog = new sap.m.Dialog({
                contentWidth: "80%",
                contentHeight: "80%",
                resizable: true,
                draggable: true,
                content: [
                  new sap.ui.core.HTML({
                    content: `<iframe id="reportFrame" width="100%" height="650px" frameborder="0"></iframe>`,
                  }),
                ],
                endButton: new sap.m.Button({
                  text: "Close",
                  press: function () {
                    oDialog.close();
                  },
                }),
                afterClose: function () {
                  debugger;
                  oDialog.destroy();
                }.bind(this),
              });

              oDialog.open();

              const iframe = document.getElementById("reportFrame");
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              iframeDoc.open();
              iframeDoc.write(oResult.html);
              iframeDoc.close();
            } else {
              MessageBox.warning("No filtered report returned from backend.");
            }
          } catch (err) {
            MessageBox.error("Error embedding filtered report: " + err.message);
          }
        },
        onCancelUserSelection: function () {
          this._oUserSelectionDialog.close();
          this._resetUserSelectionDialog();
        },
        _loadAndShowReport: async function (oReport, oUser) {
          debugger;
          const reportExposedId = oReport.ID;
          const reportName = oReport.reportComment;
          let oModel = this.getView().getModel("powerBi");

          try {
            const sPath = `/ReportsExposed(${reportExposedId})/PowerBiService.getEmbedDetails(...)`; // You can pass oUser.ID as a parameter in the path if needed
            const oBinding = oModel.bindContext(sPath);

            const oResult = await new Promise((resolve, reject) => {
              oBinding
                .execute()
                .then(() => resolve(oBinding.getBoundContext().getObject()))
                .catch(reject);
            });

            if (oResult && oResult.html) {
              const oDialog = new sap.m.Dialog({
                title: reportName,
                contentWidth: "80%",
                contentHeight: "80%",
                resizable: true,
                draggable: true,
                content: [
                  new sap.ui.core.HTML({
                    content: `<iframe id="reportFrame" width="100%" height="650px" frameborder="0"></iframe>`,
                  }),
                ],
                endButton: new sap.m.Button({
                  text: "Close",
                  press: function () {
                    oDialog.close();
                  },
                }),
                afterClose: function () {
                  debugger;
                  oDialog.destroy();
                }.bind(this),
              });

              oDialog.open();

              const iframe = document.getElementById("reportFrame");
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              iframeDoc.open();
              iframeDoc.write(oResult.html);
              iframeDoc.close();
              this._oSelectedUser = null;
            } else {
              MessageToast.show("No embed HTML received.");
            }
          } catch (error) {
            MessageBox.error("Failed to load report: " + error.message);
          }
        },

        onOpenFetchDialog: function (oEvent) {
          var oView = this.getView();
          this._reportDialogFragContext = oEvent
            .getSource()
            .getBindingContext();
          if (!this._pFetchDialog) {
            Fragment.load({
              name: "entitec.pbi.embedding.fragments.FetchFromURLDialog",
              controller: this,
              id: oView.getId(),
            }).then(
              function (oDialog) {
                oView.addDependent(oDialog);
                this._pFetchDialog = oDialog;
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._pFetchDialog.open();
          }
        },

        onTestReportURL: function () {
          var oView = this.getView();
          if (!this._testDialog) {
            Fragment.load({
              name: "entitec.pbi.embedding.fragments.TestURLDialog",
              controller: this,
              id: oView.getId(),
            }).then(
              function (oDialogTest) {
                oView.addDependent(oDialogTest);
                this._testDialog = oDialogTest;
                oDialogTest.open();
              }.bind(this)
            );
          } else {
            this._testDialog.open();
          }
        },

        onFetchFromUrlDialogClose: function () {
          var oInput = this.byId("fetchURLInput");
          if (oInput) {
            oInput.setValue("");
          }
          this._pFetchDialog.close();
        },

        onTestUrlDialogClose: function () {
          var oInput = this.byId("idTestUrlInput");
          if (oInput) {
            oInput.setValue("");
          }
          this._testDialog.close();
        },

        onConfirmFetchURL: function () {
          var sLink = this.byId("fetchURLInput").getValue();

          if (!sLink) {
            MessageToast.show("Please enter a valid link.");
            return;
          }

          // Regular expression to extract workspaceId and reportId
          const regex = /groups\/([a-f0-9\-]+)\/reports\/([a-f0-9\-]+)/;

          // Extracting the workspaceId and reportId using the regular expression
          const matches = sLink.match(regex);
          if (matches && matches.length > 2) {
            const workspaceId = matches[1];
            const reportId = matches[2];
            this.byId("idInputReportId").setValue(reportId);
            this.byId("idInputWorkspaceId").setValue(workspaceId);

            MessageToast.show(
              "Report added locally. Don’t forget to save changes."
            );
          } else {
            MessageBox.error("Enter a valid Power BI URL!");
          }
          var oInput = this.byId("fetchURLInput");
          if (oInput) {
            oInput.setValue("");
          }
          this._pFetchDialog.close();
        },

        onPasteExampleURL: async function (oEvent) {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              this.byId("fetchURLInput").setValue(text);
            } else {
              MessageBox.warning("Clipboard is empty or inaccessible.");
            }
          } catch (err) {
            MessageBox.error(
              "Failed to access clipboard. Please allow clipboard permissions."
            );
            console.error("Clipboard error:", err);
          }
        },

        onPasteTestURL: async function (oEvent) {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              this.byId("idTestUrlInput").setValue(text);
            } else {
              MessageBox.warning("Clipboard is empty or inaccessible.");
            }
          } catch (err) {
            MessageBox.error(
              "Failed to access clipboard. Please allow clipboard permissions."
            );
            console.error("Clipboard error:", err);
          }
        },

        onTestURLLoad: async function (oEvent) {
          try {
            const oInput = this.byId("idTestUrlInput");
            const sUrl = oInput.getValue().trim();

            if (!sUrl) {
              MessageBox.warning("Please enter a valid Power BI Report URL.");
              return;
            }

            const oModel = this.getView().getModel("powerBi");

            const oContextBinding = oModel.bindContext(
              "/checkReportAccess(...)"
            );
            oContextBinding.setParameter("url", sUrl);

            const oAction = await oContextBinding.execute();
            const oResult = oContextBinding.getBoundContext().getObject();
            if (oResult.statusCode === 200) {
              MessageBox.success(
                "Report is accessible to the Service Principal."
              );
            } else {
              MessageBox.error(`${oResult.message}`);
            }
          } catch (err) {
            MessageBox.error(
              "Unexpected error occurred while testing the report URL.\n" +
                err.message
            );
            console.error("onTestURLLoad Error:", err);
          }
        },

        onServicePrincipalChange: function (oEvent) {
          const selectedId = oEvent.getSource().getSelectedKey(); // GUID of selected service principal
          this.configId = selectedId; // store for later use if needed

          const oWorkspaceSelect = this.byId("workspaceSelect");

          // If not yet bound, bind first time
          if (!oWorkspaceSelect.getBinding("items")) {
            oWorkspaceSelect.bindItems({
              path: "powerBi>/LiveWorkspaces",
              template: new sap.ui.core.Item({
                key: "{powerBi>id}",
                text: "{powerBi>name}",
              }),
            });
          }

          // Apply filter on LiveWorkspaces for selected configId
          const oBinding = oWorkspaceSelect.getBinding("items");
          if (oBinding) {
            const oFilter = new sap.ui.model.Filter({
              path: "configId",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: selectedId,
            });

            oBinding.filter([oFilter]);
          }

          // Reset report select
          const oWorkSpaceSelect = this.byId("reportSelect");
          oWorkSpaceSelect.unbindItems();
          
          if(!this.addReport) {
            this.byId("workspaceSelect").fireChange(); // Trigger workspace change to update reports
          }
        },
        
        onWorkspaceChange: function (oEvent) {
          const selectedWorkspaceId = oEvent.getSource().getSelectedKey();
          const selectedConfigId = this.byId(
            "idServicePrincipalTypeInput"
          ).getSelectedKey();
          
          const oReportSelect = this.byId("reportSelect");
          // add the name of the workspace to the table binding context 
          if(oEvent.getParameter('itemPressed')){
            this._oReportDialog.getModel("tempReport").setProperty("/ReportsExposed/workspaceName", oEvent.getParameter('value'));
            oReportSelect.unbindItems();
            oReportSelect.setSelectedKey("")
          }
          if (!selectedWorkspaceId || !selectedConfigId) return;
          // const oReportSelect = this.byId("reportSelect");
          
          oReportSelect.bindItems({
            path: "powerBi>/LiveReports",
            filters: [
              new sap.ui.model.Filter("workspaceId", "EQ", selectedWorkspaceId),
              new sap.ui.model.Filter("configId", "EQ", selectedConfigId),
            ],
            template: new sap.ui.core.Item({
              key: "{powerBi>id}",
              text: "{powerBi>name}",
            }),
          });
        },

        onReportChange: function (oEvent) {
          if(oEvent.getParameter('itemPressed')){
            this._oReportDialog.getModel("tempReport").setProperty("/ReportsExposed/reportName", oEvent.getParameter('value'));
          }
        },

        //------------- Security Filters Configuration ------------------

        onAddSecurityFilterConfiguration: function () {
          this.addSecurityFilter = true;
          let oContext = this.byId("idConfigSecurityFilterTable")
            .getBinding("items")
            .create(
              {
                securityUniqueId: "",
                schema: "https://powerbi.com/product/schema#basic",
                operator: "",
                values: "",
                column: "",
                table: "",
                requireSingleSelection: false,
              },
              true,
              { groupId: "SecurityFilterChanges" }
            );
          this.openSecurityFilterConfigDialog(
            "Add Security Filter",
            "Add",
            oContext
          );
        },

        onSecurityFilterSelect: async function (oEvent) {
          let oSelectedContext = oEvent.getSource().getBindingContext();
          this._selectedSecurityFilterObject = JSON.parse(
            JSON.stringify(oSelectedContext.getObject())
          ); // store globally
          this.openSecurityFilterConfigDialog(
            "Edit Security Filter",
            "OK",
            oSelectedContext
          );
        },

        openSecurityFilterConfigDialog: function (title, button, oContext) {
          let oView = this.getView();
          if (!this._oSecurityFilterDialog) {
            this._oSecurityFilterDialog = sap.ui.xmlfragment(
              oView.getId(),
              "entitec.pbi.embedding.fragments.EditSecurityFilterConfiguration",
              this
            );
            oView.addDependent(this._oSecurityFilterDialog);
          }
          this._oSecurityFilterDialog.setBindingContext(oContext);
          this._oSecurityFilterDialog.setTitle(title);
          // this.byId("idAddSecurityFilter").setText(button);

          this._oSecurityFilterDialog.open();
        },

        onSaveEditSecurityFilterDialog: async function (oEvent) {
          let oContext = oEvent.getSource().getBindingContext();
          let securityFilterObject = oContext.getObject();

          let validated = await this._validateSecurityFilterFields(
            securityFilterObject
          );
          if (!validated) {
            return;
          }
          this._oSecurityFilterDialog.close();
          if (this.getView().getModel().hasPendingChanges('SecurityFilterChanges')) {
            this.visSaveDiscardButton('SecurityFilterChanges')
            this.onChangeHighlightTableRow("idConfigSecurityFilterTable"); // Changing the status of the table row
          }
        },

        _validateSecurityFilterFields: async function (securityFilterObject) {
          const isValid = await this.validateEntityFields(
            "SecurityFilters",
            securityFilterObject
          );
          if (!isValid) return false;
          return true;
        },

        onCloseEditSecurityFilterDialog: function (oEvent) {
          let oContext = oEvent.getSource().getBindingContext();
          debugger;
          if (
            oContext?.hasPendingChanges("SecurityFilterChanges") &&
            !oContext?.isTransient()
          ) {
            if(key.includes("isTransient")) return;
            Object.keys(this._selectedSecurityFilterObject).forEach((key) => {
              oContext.setProperty(
                key,
                this._selectedSecurityFilterObject[key]
              );
            });
          } else {
            if (oContext?.isTransient()) {
              oContext?.delete();
            }
          }
          this.onChangeHighlightTableRow("idConfigSecurityFilterTable"); // Changing the status of the table row
          this._oSecurityFilterDialog?.close();
        },

        onDeleteSecurityFilterConfig: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();

          if (!oContext) {
            MessageToast.show("No Security Filter selected for deletion.");
            return;
          }

          MessageBox.confirm(
            "Are you sure you want to delete this Security Filter?",
            {
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              onClose: function (sAction) {
                if (sAction === MessageBox.Action.OK) {
                  oContext.delete("SecurityFilterChanges");
                  this.visSaveDiscardButton('SecurityFilterChanges')
                }
              }.bind(this),
            }
          );
        },

        onRefreshSecurityFilters: function () {
          let oModel = this.getView().getModel();
          if (oModel.hasPendingChanges()) {
            this.showDiscardChangesWarning(
              "Are you sure you want to reload. Your changes will be lost?",
              null,
              oModel,
              "SecurityFilterChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idConfigSecurityFilterTable"
            );
          } else {
            oModel.resetChanges("SecurityFilterChanges");
            oModel.refresh();
            this.onChangeHighlightTableRow("idConfigSecurityFilterTable"); // Changing the status of the table row
          }
        },

        // --------- End Fragments --------------------

        onSaveChanges: async function () {
          var that = this;
          let oIconTabBar = this.byId("idConfigurationMenu");
          let oModel = this.getView().getModel();
          let sSelectedKey = oIconTabBar.getSelectedKey();

          if (sSelectedKey.includes("idServicePrincipalConfig")) {
            // Service Principal batch
            if (!oModel.hasPendingChanges("ServicePrincipalChanges")) {
              MessageToast.show("No changes detected.");
              return;
            }
            this.getModel()
              .submitBatch("ServicePrincipalChanges")
              .then(() => {
                const oContext = this.byId("idConfigTable").getBinding("items");
                const aMessages = this.getModel().getMessages(oContext);

                if (aMessages.length > 0) {
                  let aErrorMessages = aMessages.filter(
                    (msg) => msg.getType() === "Error"
                  );
                  let aWarningMessages = aMessages.filter(
                    (msg) => msg.getType() === "Warning"
                  );

                  if (aErrorMessages.length > 0) {
                    // Construct error message from multiple messages
                    let sErrorMessage = aErrorMessages
                      .map((msg) => {
                        let aTargets = msg
                          .getTargets()
                          .map((target) => target.split("/").pop());
                        return `${aTargets.join(", ")} ${msg.getMessage()}`;
                      })
                      .join("\n\n");

                    MessageBox.error(sErrorMessage);
                  } else if (aWarningMessages.length > 0) {
                    // Display warnings
                    let sWarningMessage = aWarningMessages
                      .map((msg) => msg.getMessage())
                      .join("\n");
                    MessageBox.warning(sWarningMessage);
                  } else {
                    MessageToast.show("Batch operation completed successfully");
                    that.visSaveDiscardButton('ServicePrincipalChanges');
                    that.onChangeHighlightTableRow("idConfigTable"); // Changing the status of the table row
                  }
                } else {
                  MessageToast.show(
                    "Service Principal details updated successfully."
                  );
                  that.visSaveDiscardButton('ServicePrincipalChanges')
                  that.onChangeHighlightTableRow("idConfigTable"); // Changing the status of the table row
                }
              })
              .catch((oError) => {
                MessageBox.error("Batch request failed: " + oError.message);
              });
          } else if (sSelectedKey.includes("idReportConfig")) {
            // Report batch
            if (!oModel.hasPendingChanges("ReportsChanges")) {
              MessageToast.show("No changes detected.");
              return;
            }
            this.getModel()
              .submitBatch("ReportsChanges")
              .then(() => {
                const oContext =
                  this.byId("idRCConfigTable").getBinding("items");
                const aMessages = this.getModel().getMessages(oContext);

                if (aMessages.length > 0) {
                  let aErrorMessages = aMessages.filter(
                    (msg) => msg.getType() === "Error"
                  );
                  let aWarningMessages = aMessages.filter(
                    (msg) => msg.getType() === "Warning"
                  );

                  if (aErrorMessages.length > 0) {
                    // Construct error message from multiple messages
                    let sErrorMessage = aErrorMessages
                      .map((msg) => {
                        let aTargets = msg
                          .getTargets()
                          .map((target) => target.split("/").pop()); // Extract property
                        return `${aTargets.join(", ")} ${msg.getMessage()}`;
                      })
                      .join("\n\n");

                    MessageBox.error(sErrorMessage);
                  } else if (aWarningMessages.length > 0) {
                    // Display warnings
                    let sWarningMessage = aWarningMessages
                      .map((msg) => msg.getMessage())
                      .join("\n");
                    MessageBox.warning(sWarningMessage);
                  } else {
                    MessageToast.show("Batch operation completed successfully");
                    that.onChangeHighlightTableRow('idRCConfigTable');
                    that.visSaveDiscardButton('ReportsChanges')
                  }
                } else {
                  MessageToast.show("Report details updated successfully.");
                  if(!that.addReport){
                    oModel.refresh();
                  }
                  that.onChangeHighlightTableRow('idRCConfigTable');
                  that.visSaveDiscardButton('ReportsChanges')
                }
              })
              .catch((oError) => {
                MessageBox.error("Batch request failed: " + oError.message);
              });
          } else if (sSelectedKey.includes("idSecurityFilterConfig")) {
            // Security Filter batch
            if (!oModel.hasPendingChanges("SecurityFilterChanges")) {
              MessageToast.show("No changes detected.");
              return;
            }
            this.getModel()
              .submitBatch("SecurityFilterChanges")
              .then(() => {
                const oContext = this.byId(
                  "idConfigSecurityFilterTable"
                ).getBinding("items");
                const aMessages = this.getModel().getMessages(oContext);

                if (aMessages.length > 0) {
                  let aErrorMessages = aMessages.filter(
                    (msg) => msg.getType() === "Error"
                  );
                  let aWarningMessages = aMessages.filter(
                    (msg) => msg.getType() === "Warning"
                  );

                  if (aErrorMessages.length > 0) {
                    // Construct error message from multiple messages
                    let sErrorMessage = aErrorMessages
                      .map((msg) => {
                        let aTargets = msg
                          .getTargets()
                          .map((target) => target.split("/").pop());
                        return `${aTargets.join(", ")} ${msg.getMessage()}`;
                      })
                      .join("\n\n");

                    MessageBox.error(sErrorMessage);
                  } else if (aWarningMessages.length > 0) {
                    // Display warnings
                    let sWarningMessage = aWarningMessages
                      .map((msg) => msg.getMessage())
                      .join("\n");
                    MessageBox.warning(sWarningMessage);
                  } else {
                    MessageToast.show("Batch operation completed successfully");
                    that.visSaveDiscardButton('SecurityFilterChanges')
                    that.onChangeHighlightTableRow(
                      "idConfigSecurityFilterTable"
                    ); // Changing the status of the table row
                  }
                } else {
                  MessageToast.show("Report details updated successfully.");
                  that.visSaveDiscardButton('SecurityFilterChanges')
                  that.onChangeHighlightTableRow("idConfigSecurityFilterTable"); // Changing the status of the table row
                }
              })
              .catch((oError) => {
                MessageBox.error("Batch request failed: " + oError.message);
              });
          }
        },
        onDiscardChanges: function () {
          let oIconTabBar = this.byId("idConfigurationMenu");
          let sSelectedKey = oIconTabBar.getSelectedKey();
          let oModel = this.getView().getModel();

          if (sSelectedKey.includes("idServicePrincipalConfig")) {
            this.showDiscardChangesWarning(
              "Are you sure you want to discard your changes?",
              null,
              oModel,
              "ServicePrincipalChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idConfigTable"
            );
          } else if (sSelectedKey.includes("idReportConfig")) {
            this.showDiscardChangesWarning(
              "Are you sure you want to discard your changes?",
              null,
              oModel,
              "ReportsChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idRCConfigTable"
            );
          } else if (sSelectedKey.includes("idSecurityFilterConfig")) {
            this.showDiscardChangesWarning(
              "Are you sure you want to discard your changes?",
              null,
              oModel,
              "SecurityFilterChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idConfigSecurityFilterTable"
            );
          }
        },
        showDiscardChangesWarning: function (
          message,
          callBack,
          model,
          groupId,
          view,
          buttonIds = [],
          sourceTable,
          cancelFunction
        ) {
          var that = this;
          let oViewModel = this.getView().getModel('appView')
          MessageBox.warning(message, {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                if (model && groupId) {
                  model.resetChanges(groupId);
                  model.refresh();
                }
                if (view && buttonIds.length > 0) {
                  buttonIds.forEach((id) => {
                    // view.byId(id)?.setEnabled(false);
                    oViewModel.setProperty(`/${id}`, false);
                  });
                }
                if (sourceTable) {
                  that.onChangeHighlightTableRow(sourceTable);
                }
                if (callBack) {
                  callBack();
                }
              }
              if (sAction === MessageBox.Action.CANCEL && cancelFunction){
                cancelFunction();
              }
            },
          });
        },
        onIconTabBarChange: function(oEvent){
          let oModel = this.getView().getModel(), 
          previousKey = oEvent.getParameter('previousKey');

          const cancelFunction = ()=>{
            this.byId("idConfigurationMenu").setSelectedKey(previousKey)
          }

          const callBack = ()=>{

          }

          if(previousKey.includes("idServicePrincipalConfig")){
            // 1. Check if there is any pending changes in the model 
            let bChange = oModel.hasPendingChanges('ServicePrincipalChanges');
            // 2. show the warning msg box
            if(bChange){
              // 3. if Ok then discard all the changes and navigate to the selected tab
              this.showDiscardChangesWarning(
                "You have unsaved changes. Press OK to discard them and proceed, or Cancel to go back and save your changes.",
                null,
                oModel,
                "ServicePrincipalChanges",
                this,
                ["visDiscardButton", "visSaveButton"],
                "idConfigTable",
                cancelFunction.bind(this)
              );
            }
          } else if (previousKey.includes("idReportConfig")){
            // 1. Check if there is any pending changes in the model 
            let bChange = oModel.hasPendingChanges('ReportsChanges');
            // 2. show the warning msg box
            if(bChange){
              // 3. if Ok then discard all the changes and navigate to the selected tab
              this.showDiscardChangesWarning(
                "You have unsaved changes. Press OK to discard them and proceed, or Cancel to go back and save your changes.",
                null,
                oModel,
                "ReportsChanges",
                this,
                ["visDiscardButton", "visSaveButton"],
                "idRCConfigTable",
                cancelFunction.bind(this)
              );
            }
          } else if(previousKey.includes("idSecurityFilterConfig")){
            // 1. Check if there is any pending changes in the model 
            let bChange = oModel.hasPendingChanges('SecurityFilterChanges');
            // 2. show the warning msg box
            if(bChange){
              // 3. if Ok then discard all the changes and navigate to the selected tab
              this.showDiscardChangesWarning(
                "You have unsaved changes. Press OK to discard them and proceed, or Cancel to go back and save your changes.",
                null,
                oModel,
                "SecurityFilterChanges",
                this,
                ["visDiscardButton", "visSaveButton"],
                "idConfigSecurityFilterTable",
                cancelFunction.bind(this)
              );
            }
          }
        }
      }
    );
  }
);
