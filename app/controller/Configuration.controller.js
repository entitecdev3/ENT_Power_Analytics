
sap.ui.define([
  "sap/m/MessageToast",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (MessageToast, BaseController, MessageBox, Fragment) {
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
    },

    //------------- Service Principal Configuration ------------------

    onAddServicePrincipalConfiguration: function () {
      let oListBinding = this.getView().byId("idConfigTable").getBinding("items"); 

      let oNewContext = oListBinding.create({}, true, { groupId: "ServicePrincipalChanges" });

      this.openConfigDialog("Add Service Principal", "Add", oNewContext);
    },

    onConfigSelect: async function (oEvent) {
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openConfigDialog("Edit Service Principal", "Update", oSelectedContext);
    },

    openConfigDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oDialog) {
        this._oDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditServicePrincipalConfiguration", this);
        oView.addDependent(this._oDialog);
      }

      this._oDialog.setBindingContext(oContext);
      this._oDialog.setModel(oContext.getModel());
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
      this.openReportsConfigDialog("Add Report", "Add");
    },

    onReportSelect: async function (oEvent) {
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openReportsConfigDialog("Edit Report", "Update", oSelectedContext);
    },

    openReportsConfigDialog: function (title, button, oContext) {
      let oView = this.getView();

      if (!this._oReportDialog) {
        this._oReportDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditReportsExposedConfiguration", this);
        oView.addDependent(this._oReportDialog);
      }

      this._bIsEditMode = !!oContext; 
      
      if (!this._bIsEditMode) {
        this._oReportDialog.setBindingContext(null);
      } else {
        this._oReportDialog.setBindingContext(oContext);
        this._oReportDialog.setModel(oContext.getModel());
      }

      this._oReportDialog.setTitle(title);
      this.byId("idAddReports").setText(button);
      this._oReportDialog.open();
    },

    onSaveEditReportsDialog: async function () {
      const oView = this.getView();
      const oDialog = this._oReportDialog;
  

      const reportId = this.byId("idInputReportId").getValue();
      const workspaceId = this.byId("idInputWorkspaceId").getValue();
      const reportComment = this.byId("idInputReportComment").getValue();
      const workspaceComment = this.byId("idInputWorkspaceComment").getValue();

      const reportObject = {
        reportId,
        workspaceId,
        reportComment: reportComment,
        workspaceComment: workspaceComment
      };

      let validated = await this._validateReportFields(reportObject);
      if (!validated) {
        return;
      }

      if (this._bIsEditMode) {
        const oContext = oDialog.getBindingContext();
        Object.keys(reportObject).forEach(key => oContext.setProperty(key, reportObject[key]));
      } else {
        const oListBinding = this.byId("idRCConfigTable").getBinding("items");
        oListBinding.create(reportObject, false, { groupId: "ReportsChanges" });
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
      let oModel = this.getView().getModel();
      if (!reportExposedId) {
        MessageBox.error("Report not found in the database!");
        return;
      }

      const sPath = `/ReportsExposed(${reportExposedId})/PowerBiService.getEmbedDetails(...)`;
      const oBinding = oModel.bindContext(sPath);

      await oBinding.execute();

      const oContext = oBinding.getBoundContext();
      const oResult = oContext.getObject();

      if (oResult && oResult.html) {
        // Create and open the Dialog
        debugger;
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
    },

    onOpenFetchDialog: function () {
      var oView = this.getView();

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


    onTestReportURL: async function () {

      if (!this._testDialog) {
        this._testDialog = await Fragment.load({
          id: this.getView().getId(),
          name: "entitec.pbi.embedding.fragments.TestReportURLDialog",
          controller: this
        });
        this.getView().addDependent(this._testDialog);
      }
      this._testDialog.open();
    },

    onFetchFromUrlDialogClose: function () {
      var oInput = this.byId("fetchURLInput");
      if (oInput) {
        oInput.setValue("");
      }
      this._pFetchDialog.close();
    },

    onTestUrlDialogClose: function () {
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



    //------------- Security Filters Configuration ------------------

    onAddSecurityFilterConfiguration: function () {

      let oListBinding = this.getView().byId("idConfigSecurityFilterTable").getBinding("items"); 

      let oNewContext = oListBinding.create({}, true, { groupId: "SecurityFilterChanges" });

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
      this._oSecurityFilterDialog.setModel(oContext.getModel());
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
