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
      this._oRouter
        .getRoute("Configuration")
        .attachPatternMatched(this._matchedHandler, this);
      this._oODataModelConfiguration = this.getView().getModel(); // OData V4 Model
    },
    _matchedHandler: function () {
      let oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", true);   // Show back button
      oViewModel.setProperty("/LoginHeader", false);   // Show back button
      oViewModel.setProperty("/HomeScreen", true);   // Show back button
    },

    //------------- Service Principal Configuration ------------------

    onAddServicePrincipalConfiguration: function () {
      let oListBinding = this.getView().byId("idConfigTable").getBinding("items"); // Get the list binding

      // 🔹 Create a new entry in "UserChanges" group (Deferred Mode)
      let oNewContext = oListBinding.create({}, true, { groupId: "ServicePrincipalChanges" });// 'true' ensures it's not auto-committed

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
      var oItem = oEvent.getParameter("listItem"); // Get the list item to delete
      var oContext = oItem.getBindingContext(); // Get binding context of the item

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

    onSaveEditServicePrincipalDialog: function () {
      let oContext = this._oDialog.getBindingContext();
      let userObject = oContext.getObject();

      // 🔹 Step 1: Validate Required Fields
      let validated = this._validateSPFields(userObject);
      if (!validated) {
        return;
      }
      this._oDialog.close();

    },

    _validateSPFields: function (userObject) {
      // let errors = [];

      if (!userObject.BIAccountUser) {
        MessageBox.error("Account Username is required.");
        return false;
      }
      if (!userObject.clientId) {
        MessageBox.error("Client ID is required.");
        return false;
      }
      if (!userObject.clientSecret) {
        MessageBox.error("Client Secret is required.");
        return false;
      }
      if (!userObject.tenantId) {
        MessageBox.error("Tenant ID is required.");
        return false;
      }

      return true;
      // return errors;
    },

    onCloseEditServicePrincipalDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("ServicePrincipalChanges");
      this._oDialog.close();
    },

    //------------- Reports Exposed Configuration ------------------

    onAddReportsConfiguration: function () {

      let oListBinding = this.getView().byId("idRCConfigTable").getBinding("items"); // Get the list binding

      // 🔹 Create a new entry in "UserChanges" group (Deferred Mode)
      let oNewContext = oListBinding.create({}, true, { groupId: "ReportsChanges" });// 'true' ensures it's not auto-committed

      this.openReportsConfigDialog("Add Reports", "Add", oNewContext);
    },

    onReportSelect: async function (oEvent) {
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openReportsConfigDialog("Edit Reports", "Update", oSelectedContext);
    },

    openReportsConfigDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oReportDialog) {
        this._oReportDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditReportsExposedConfiguration", this);
        oView.addDependent(this._oReportDialog);
      }
      this._oReportDialog.setBindingContext(oContext);
      this._oReportDialog.setModel(oContext.getModel());
      this._oReportDialog.setTitle(title);
      this.byId("idAddReports").setText(button);
      this._oReportDialog.open();
    },

    onSaveEditReportsDialog: function () {
      let oContext = this._oReportDialog.getBindingContext();
      let reportObject = oContext.getObject();

      // 🔹 Step 1: Validate Required Fields
      let validated = this._validateReportFields(reportObject);
      if (!validated) {
        return;
      }
      this._oReportDialog.close();

    },

    _validateReportFields: function (reportObject) {

      if (!reportObject.reportId) {
        MessageBox.error("Account Username is required.");
        return false;
      }
      if (!reportObject.reportComment) {
        MessageBox.error("Client ID is required.");
        return false;
      }
      if (!reportObject.workspaceId) {
        MessageBox.error("Client Secret is required.");
        return false;
      }
      if (!reportObject.workspaceComment) {
        MessageBox.error("Tenant ID is required.");
        return false;
      }

      return true;
    },

    onCloseEditReportsDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("ReportsChanges");
      this._oReportDialog.close();
    },

    onDeleteReport: function (oEvent) {
      var oItem = oEvent.getParameter("listItem"); // Get the list item to delete
      var oContext = oItem.getBindingContext(); // Get binding context of the item

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

    //------------- Security Filters Configuration ------------------

    onAddSecurityFilterConfiguration: function () {

      let oListBinding = this.getView().byId("idConfigSecurityFilterTable").getBinding("items"); // Get the list binding

      // 🔹 Create a new entry in "UserChanges" group (Deferred Mode)
      let oNewContext = oListBinding.create({}, true, { groupId: "SecurityFilterChanges" });// 'true' ensures it's not auto-committed

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

    onSaveEditSecurityFilterDialog: function () {
      let oContext = this._oSecurityFilterDialog.getBindingContext();
      let securityFilterObject = oContext.getObject();

      // 🔹 Step 1: Validate Required Fields
      let validated = this._validateSecurityFilterFields(securityFilterObject);
      if (!validated) {
        return;
      }
      this._oSecurityFilterDialog.close();

    },

    _validateSecurityFilterFields: function (securityFilterObject) {

      if (!securityFilterObject.reportId) {
        MessageBox.error("Account Username is required.");
        return false;
      }
      if (!securityFilterObject.reportComment) {
        MessageBox.error("Client ID is required.");
        return false;
      }
      if (!securityFilterObject.workspaceId) {
        MessageBox.error("Client Secret is required.");
        return false;
      }
      if (!securityFilterObject.workspaceComment) {
        MessageBox.error("Tenant ID is required.");
        return false;
      }

      return true;
    },

    onCloseEditSecurityFilterDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("SecurityFilterChanges");
      this._oSecurityFilterDialog.close();
    },

    onDeleteSecurityFilterConfig: function (oEvent) {
      var oItem = oEvent.getParameter("listItem"); // Get the list item to delete
      var oContext = oItem.getBindingContext(); // Get binding context of the item

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
      let oModel = this.getView().getModel(); // OData V4 Model

      // 🔹 Step 1: Check if there are any pending changes
      if (!oModel.hasPendingChanges()) {
        MessageToast.show("No changes detected.");
        return;
      }

      // Get the IconTabBar control
      let oIconTabBar = this.byId("idConfigurationMenu");

      // Get the selected tab key
      let sSelectedKey = oIconTabBar.getSelectedKey();

      if (sSelectedKey === "idServicePrincipalConfig") {
        // Service Principal batch 
        this.getModel().submitBatch("ServicePrincipalChanges").then(() => {
          // Retrieve all messages from the model
          const oContext = this.byId("idConfigTable").getBinding("items");
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
            MessageToast.show("Service Principal details updated successfully.");
          }
        }).catch(oError => {
          MessageBox.error("Batch request failed: " + oError.message);
        });
      } else if (sSelectedKey === "idReportConfig") {
        // Report batch
        this.getModel().submitBatch("ReportsChanges").then(() => {
          // Retrieve all messages from the model
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
      } else if (sSelectedKey === "idSecurityFilterConfig") {
        this.getModel().submitBatch("SecurityFilterChanges").then(() => {
          // Retrieve all messages from the model
          const oContext = this.byId("idConfigSecurityFilterTable").getBinding("items");
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
      }




    }

  });
});
