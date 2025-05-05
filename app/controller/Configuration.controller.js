sap.ui.define([
  "sap/m/MessageToast",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment",
  "sap/ui/model/Context"
], function (MessageToast, BaseController, MessageBox, Fragment, Context) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Configuration", {
    onInit: function onInit(oEvent) {
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
      this.getModel().refresh();
    },

    //------------- Service Principal Configuration ------------------

    onAddServicePrincipalConfiguration: function () {
      this.addServicePrincipal = true;
      let oAppModel = this.getModel("appView");
      oAppModel.setProperty("/NewServicePrincipal", {});
      let oNewContext = new Context(oAppModel, "/NewServicePrincipal");
      this.openConfigDialog("Add Service Principal", "Add", oNewContext);
    },

    onConfigSelect: async function (oEvent) {
      this.addServicePrincipal = false;
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openConfigDialog("Edit Service Principal", "Update", oSelectedContext);
    },

    openConfigDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oDialog) {
        this._oDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditServicePrincipalConfiguration", this);
        oView.addDependent(this._oDialog);
      }

      this._oDialog.setBindingContext(null);
      this._oDialog.setBindingContext(oContext);
      this._oDialog.unbindElement();
      this._oDialog.setModel(oContext.getModel());
      if (this.addServicePrincipal) {
        this._oDialog.bindElement({
          path: oContext.getPath(),
          parameters: {
            $$updateGroupId: "ServicePrincipalChanges" // e.g., "$auto", "$direct", or a custom one
          }
        });
      }
      this._oDialog.setTitle(title);
      this.byId("idAddConfig").setText(button);
      this._oDialog.open();
    },

    onDeleteConfig: function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oContext = oItem.getBindingContext();

      if (!oContext) {
        MessageToast.show("No Service Principal selected for deletion.");
        return;
      }

      MessageBox.confirm("Are you sure you want to delete this Service Principal?", {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            oContext.delete("ServicePrincipalChanges");
          }
        }
      });
    },

    onRefreshServicePrincipal: function () {
      let oModel = this.getView().getModel();
      if (oModel.hasPendingChanges()) {
        MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oModel.resetChanges("ServicePrincipalChanges");
              oModel.refresh();
            }
          }
        });
      } else {
        oModel.resetChanges("ServicePrincipalChanges");
        oModel.refresh();
      }
    },

    onSaveEditServicePrincipalDialog: async function () {
      let oContext = this._oDialog.getBindingContext();
      let userObject = oContext.getObject();
      // oListBinding.refresh();
      let oListBinding = this.getView().byId("idConfigTable").getBinding("items"); // Get the list binding
      if (this.addServicePrincipal) {
        oListBinding.create(userObject, true, { groupId: "ServicePrincipalChanges" });
      }
      else {
        // oListBinding.refresh();
      }
      // else {
      //   // Edit existing entry, update via patch
      //   if (!oContext.isTransient()) {
      //     try {
      //       await oListBinding.patch(userObject, {
      //         groupId: "ServicePrincipalChanges"
      //       });
      //     } catch (err) {
      //       sap.m.MessageBox.error("Failed to update entry: " + err.message);
      //       return;
      //     }
      //   }
      // }
      let validated = await this._validateSPFields(userObject);
      if (!validated) {
        return;
      }
      this._oDialog.close();

    },

    _validateSPFields: async function (userObject) {

      const isValid = await this.validateEntityFields("PowerBi", userObject);

      if (!isValid) return false;
      return true;
    },

    onCloseEditServicePrincipalDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("ServicePrincipalChanges");
      this._oDialog.close();
    },

    //------------- Reports Exposed Configuration ------------------

    onAddReportsConfiguration: function () {
      this.addReport = true;
      let oAppModel = this.getModel("appView");
      oAppModel.setProperty("/NewReport", {});
      let oNewContext = new Context(oAppModel, "/NewReport");
      this.openReportsConfigDialog("Add Report", "Add", oNewContext);
    },

    onReportSelect: async function (oEvent) {
      this.addReport = false;
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openReportsConfigDialog("Edit Report", "Update", oSelectedContext);
    },

    openReportsConfigDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oReportDialog) {
        this._oReportDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditReportsExposedConfiguration", this);
        oView.addDependent(this._oReportDialog);
      }

      this._oReportDialog.setBindingContext(null);
      this._oReportDialog.setBindingContext(oContext);
      this._oReportDialog.unbindElement();
      this._oReportDialog.setModel(oContext.getModel());
      if (this.addReport) {
        this._oReportDialog.bindElement({
          path: oContext.getPath(),
          parameters: {
            $$updateGroupId: "ReportsChanges"
          }
        });
      }
      this._oReportDialog.setTitle(title);
      this.byId("idAddReports").setText(button);
      this._oReportDialog.open();
    },

    onSaveEditReportsDialog: async function () {
      let oContext = this._oReportDialog.getBindingContext();
      let reportObject = oContext.getObject();
      let oListBinding = this.getView().byId("idConfigTable").getBinding("items");
      if (this.addReport) {
        oListBinding.create(userObject, true, { groupId: "ReportsChanges" });
      }

      let validated = await this._validateReportFields(reportObject);
      if (!validated) {
        return;
      }
      this._oReportDialog.close();

    },

    _validateReportFields: async function (reportObject) {
      const isValid = await this.validateEntityFields("ReportsExposed", reportObject);

      if (!isValid) return false;
      return true;
    },

    onCloseEditReportsDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("ReportsChanges");
      this._oReportDialog.close();
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
          }
        }
      });
    },

    onRefreshReports: function () {
      let oModel = this.getView().getModel();
      if (oModel.hasPendingChanges()) {
        MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oModel.resetChanges("ReportsChanges");
              oModel.refresh();
            }
          }
        });
      } else {
        oModel.resetChanges("ReportsChanges");
        oModel.refresh();
      }
    },

    onLoadReport: async function (oEvent) {
      const oReport = oEvent.getSource().getBindingContext().getObject();
      const reportExposedId = oReport.ID;
      const reportName = oReport.reportComment;
      let oModel = this.getView().getModel("powerBi");

      if (!reportExposedId) {
        MessageBox.error("Report not found in the database!");
        return;
      }

      const sPath = `/ReportsExposed(${reportExposedId})/PowerBiService.getEmbedDetails(...)`;
      const oBinding = oModel.bindContext(sPath);

      try {
        const oResult = await new Promise((resolve, reject) => {
          oBinding.execute().then(() => {
            const oContext = oBinding.getBoundContext();
            const oData = oContext.getObject();
            resolve(oData);
          }).catch((reject) => {

          });
        });

        if (oResult && oResult.html) {
          // Create and open the Dialog
          const oDialog = new sap.m.Dialog({
            title: reportName,
            contentWidth: "80%",
            contentHeight: "80%",
            resizable: true,
            draggable: true,
            content: [
              new sap.ui.core.HTML({
                content: `<iframe id="reportFrame" width="100%" height="650px" frameborder="0"></iframe>`
              })
            ],
            endButton: new sap.m.Button({
              text: "Close",
              press: function () {
                oDialog.close();
              }
            }),
            afterClose: function () {
              oDialog.destroy();
            }
          });

          oDialog.open();

          const iframe = document.getElementById("reportFrame");
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(oResult.html);
          iframeDoc.close();

        } else {
          MessageToast.show("No embed HTML received.");
        }
      } catch (error) {
        MessageBox.error("Failed to load report: " + error.message);
      }
    },

    onOpenFetchDialog: function (oEvent) {
      var oView = this.getView();
      this._reportDialogFragContext = oEvent.getSource().getBindingContext();
      if (!this._pFetchDialog) {
        Fragment.load({
          name: "entitec.pbi.embedding.fragments.FetchFromURLDialog",
          controller: this,
          id: oView.getId(),
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          this._pFetchDialog = oDialog;
          oDialog.open();
        }.bind(this));
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
        }).then(function (oDialogTest) {
          oView.addDependent(oDialogTest);
          this._testDialog = oDialogTest;
          oDialogTest.open();
        }.bind(this));
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

        MessageToast.show("Report added locally. Don’t forget to save changes.");
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
        MessageBox.error("Failed to access clipboard. Please allow clipboard permissions.");
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
        MessageBox.error("Failed to access clipboard. Please allow clipboard permissions.");
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

        const oContextBinding = oModel.bindContext("/checkReportAccess(...)");
        oContextBinding.setParameter("url",sUrl);

        const oAction = await oContextBinding.execute();
        const oResult = oContextBinding.getBoundContext().getObject();
        if (oResult.statusCode === 200) {
          MessageBox.success("Report is accessible to the Service Principal.");
        } else {
          MessageBox.error(`${oResult.message}`);
        }
      } catch (err) {
        MessageBox.error("Unexpected error occurred while testing the report URL.\n" + err.message);
        console.error("onTestURLLoad Error:", err);
      }
    },



    //------------- Security Filters Configuration ------------------

    onAddSecurityFilterConfiguration: function () {
      let oAppModel = this.getModel("appView");
      oAppModel.setProperty("/NewSecurityFilter", {});

      let oNewContext = new Context(oAppModel, "/NewSecurityFilter");
      this.openSecurityFilterConfigDialog("Add Security Filter", "Add", oNewContext);
    },

    onSecurityFilterSelect: async function (oEvent) {
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openSecurityFilterConfigDialog("Edit Security Filter", "Update", oSelectedContext);
    },

    openSecurityFilterConfigDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oSecurityFilterDialog) {
        this._oSecurityFilterDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditSecurityFilterConfiguration", this);
        oView.addDependent(this._oSecurityFilterDialog);
      }
      this._oSecurityFilterDialog.setBindingContext(oContext);
      this._oSecurityFilterDialog.setTitle(title);
      this.byId("idAddSecurityFilter").setText(button);
      this._oSecurityFilterDialog.open();
    },

    onSaveEditSecurityFilterDialog: async function () {
      let oContext = this._oSecurityFilterDialog.getBindingContext();
      let securityFilterObject = oContext.getObject();

      let validated = await this._validateSecurityFilterFields(securityFilterObject);
      if (!validated) {
        return;
      }
      this._oSecurityFilterDialog.close();

    },

    _validateSecurityFilterFields: async function (securityFilterObject) {
      const isValid = await this.validateEntityFields("SecurityFilters", securityFilterObject);
      if (!isValid) return false;
      return true;
    },

    onCloseEditSecurityFilterDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("SecurityFilterChanges");
      this._oSecurityFilterDialog.close();
    },

    onDeleteSecurityFilterConfig: function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oContext = oItem.getBindingContext();

      if (!oContext) {
        MessageToast.show("No Security Filter selected for deletion.");
        return;
      }

      MessageBox.confirm("Are you sure you want to delete this Security Filter?", {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            oContext.delete("SecurityFilterChanges");
          }
        }
      });
    },

    onRefreshSecurityFilters: function () {
      let oModel = this.getView().getModel();
      if (oModel.hasPendingChanges()) {
        MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oModel.resetChanges("SecurityFilterChanges");
              oModel.refresh();
            }
          }
        });
      } else {
        oModel.resetChanges("SecurityFilterChanges");
        oModel.refresh();
      }
    },

    // --------- End Fragments --------------------

    onSaveChanges: function () {
      let oIconTabBar = this.byId("idConfigurationMenu");
      let oModel = this.getView().getModel();
      let sSelectedKey = oIconTabBar.getSelectedKey();

      if (sSelectedKey.includes("idServicePrincipalConfig")) {
        // Service Principal batch 
        if (!oModel.hasPendingChanges("ServicePrincipalChanges")) {
          MessageToast.show("No changes detected.");
          return;
        }
        this.getModel().submitBatch("ServicePrincipalChanges").then(() => {
          const oContext = this.byId("idConfigTable").getBinding("items");
          const aMessages = this.getModel().getMessages(oContext);

          if (aMessages.length > 0) {
            let aErrorMessages = aMessages.filter(msg => msg.getType() === "Error");
            let aWarningMessages = aMessages.filter(msg => msg.getType() === "Warning");

            if (aErrorMessages.length > 0) {
              // Construct error message from multiple messages
              let sErrorMessage = aErrorMessages.map(msg => {
                let aTargets = msg.getTargets().map(target => target.split("/").pop());
                return `${aTargets.join(", ")} ${msg.getMessage()}`;
              }
              ).join("\n\n");

              MessageBox.error(sErrorMessage);
            } else if (aWarningMessages.length > 0) {
              // Display warnings
              let sWarningMessage = aWarningMessages.map(msg => msg.getMessage()).join("\n");
              MessageBox.warning(sWarningMessage);
            } else {
              MessageToast.show("Batch operation completed successfully");
            }
          } else {
            MessageToast.show("Service Principal details updated successfully.");
          }
        }).catch(oError => {
          MessageBox.error("Batch request failed: " + oError.message);
        });
      } else if (sSelectedKey.includes("idReportConfig")) {
        // Report batch
        if (!oModel.hasPendingChanges("ReportsChanges")) {
          MessageToast.show("No changes detected.");
          return;
        }
        this.getModel().submitBatch("ReportsChanges").then(() => {
          const oContext = this.byId("idRCConfigTable").getBinding("items");
          const aMessages = this.getModel().getMessages(oContext);

          if (aMessages.length > 0) {
            let aErrorMessages = aMessages.filter(msg => msg.getType() === "Error");
            let aWarningMessages = aMessages.filter(msg => msg.getType() === "Warning");

            if (aErrorMessages.length > 0) {
              // Construct error message from multiple messages
              let sErrorMessage = aErrorMessages.map(msg => {
                let aTargets = msg.getTargets().map(target => target.split("/").pop()); // Extract property
                return `${aTargets.join(", ")} ${msg.getMessage()}`;
              }
              ).join("\n\n");

              MessageBox.error(sErrorMessage);
            } else if (aWarningMessages.length > 0) {
              // Display warnings
              let sWarningMessage = aWarningMessages.map(msg => msg.getMessage()).join("\n");
              MessageBox.warning(sWarningMessage);
            } else {
              MessageToast.show("Batch operation completed successfully");
            }
          } else {
            MessageToast.show("Report details updated successfully.");
          }
        }).catch(oError => {
          MessageBox.error("Batch request failed: " + oError.message);
        });
      } else if (sSelectedKey.includes("idSecurityFilterConfig")) {
        // Security Filter batch
        if (!oModel.hasPendingChanges("SecurityFilterChanges")) {
          MessageToast.show("No changes detected.");
          return;
        }
        this.getModel().submitBatch("SecurityFilterChanges").then(() => {
          const oContext = this.byId("idConfigSecurityFilterTable").getBinding("items");
          const aMessages = this.getModel().getMessages(oContext);

          if (aMessages.length > 0) {
            let aErrorMessages = aMessages.filter(msg => msg.getType() === "Error");
            let aWarningMessages = aMessages.filter(msg => msg.getType() === "Warning");

            if (aErrorMessages.length > 0) {
              // Construct error message from multiple messages
              let sErrorMessage = aErrorMessages.map(msg => {
                let aTargets = msg.getTargets().map(target => target.split("/").pop());
                return `${aTargets.join(", ")} ${msg.getMessage()}`;
              }
              ).join("\n\n");

              MessageBox.error(sErrorMessage);
            } else if (aWarningMessages.length > 0) {
              // Display warnings
              let sWarningMessage = aWarningMessages.map(msg => msg.getMessage()).join("\n");
              MessageBox.warning(sWarningMessage);
            } else {
              MessageToast.show("Batch operation completed successfully");
            }
          } else {
            MessageToast.show("Report details updated successfully.");
          }
        }).catch(oError => {
          MessageBox.error("Batch request failed: " + oError.message);
        });
      }
    }

  });
});
