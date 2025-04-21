sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/ui/core/Fragment",
  "entitec/pbi/embedding/model/formatter"
], function (Controller, MessageToast, MessageBox, BaseController, Fragment, formatter) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Users", {
    formatter: formatter,
    
    onInit: function () {
      this.getRouter().getRoute("Users").attachPatternMatched(this._matchedHandler, this);
      this._oODataModel = this.getView().getModel(); // OData V4 Model

      try {
        let oModel = this.getView().getModel(); // Ensure the OData model is set
        // Attach the 'requestFailed' event to the model to catch errors
        oModel.attachRequestFailed(this._onRequestFailed, this);
      } catch (oErr) {
      }

    },

    _matchedHandler: function () {
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", true);   // Show back button
      oViewModel.setProperty("/LoginHeader", false);   // Show back button
      oViewModel.setProperty("/HomeScreen", true);   // Show back button
      // this.onUsersLoaded();
    },

    onAddUser: function () {
      this.addUserPress = true;

      let oListBinding = this.getView().byId("idTableUsers").getBinding("items"); // Get the list binding

      // 🔹 Create a new entry in "UserChanges" group (Deferred Mode)
      let oNewContext = oListBinding.create({}, true, { groupId: "UserChanges" });// 'true' ensures it's not auto-committed

      this.openUserDialog("Add User", "Add", oNewContext);
    },
    onRefreshUsers: function () {
      let oModel = this.getView().getModel();
      if (oModel.hasPendingChanges()) {
        MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oModel.resetChanges("UserChanges");
              oModel.refresh();
            }
          }
        });
      } else {
        oModel.resetChanges("UserChanges");
        oModel.refresh();
      }
    },
    onCloseEditUserDialog: function () {
      let oModel = this.getView().getModel();
      oModel.resetChanges("UserChanges");
      this._oDialog.close();
    },
    onAccountNewPasswordLiveChange: function (oEvent) {
      var getConfirmPass = oEvent.getParameter('value');
      var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      // this.getView().getModel('appView').setProperty("/accountNewPassword", getConfirmPass);
      if (pattern.test(getConfirmPass)) {
        this.getView().getModel('appView').setProperty("/Password/NewPasswordValueState", "None");
        this.getView().getModel('appView').setProperty("/Password/NewPasswordVST", "");
      } else {
        this.getView().getModel('appView').setProperty("/Password/NewPasswordValueState", "Error");
        this.getView().getModel('appView').setProperty("/Password/NewPasswordVST", "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character");
      }
    },
    onAccountConfirmPasswordLiveChange: function (oEvent) {
      var getConfirmPass = oEvent.getParameter('value');
      var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      // this.getView().getModel('appView').setProperty("/accountConfirmPassword", getConfirmPass);
      if (pattern.test(getConfirmPass)) {
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordValueState", "None");
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordVST", "");
      } else {
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordValueState", "Error");
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordVST", "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character");
      }
    },
    onSaveEditUserDialog: async function () {
      let oContext = this._oDialog.getBindingContext();
      let userObject = oContext.getObject();

      // 🔹 Step 1: Prepare fields to skip
      let skipFields = ["Password"];

      // 🔹 Step 2: Validate fields
      let validated = await this.validateEntityFields("Users", userObject, skipFields);
      if (!validated) {
        return;
      }

      // 🔹 Step 3: If it's Add, now show password popup
      if (this.addUserPress) {
        this._handlePasswordPopup("Create Password", "OK");
      } else {
        this._oDialog.close();
      }
    },
    _validateUserFields: async function (userObject) {

      const isValid = await this.validateEntityFields("Users", userObject);

      if (!isValid) return false;
      return true;

    },
    _handlePasswordPopup: function (title, button) {
      let oView = this.getView();

      // ✅ Ensure appView model has the "Password" object initialized before opening the fragment
      let oModel = this.getView().getModel("appView");
      if (!oModel.getProperty("/Password")) {
        oModel.setProperty("/Password", {
          NewPassword: "",
          ConfirmPassword: "",
          NewPasswordValueState: "None",
          ConfirmPasswordValueState: "None"
        });
      }

      if (!this.UserPasswordDialog) {
        this.UserPasswordDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.Password", this);
        oView.addDependent(this.UserPasswordDialog);
      }
      this.UserPasswordDialog.setTitle(title);
      this.byId("idPasswordSave").setText(button);
      this.UserPasswordDialog.open();
    },
    validatePassword: function (newPassword, confirmPassword) {
      var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!newPassword && confirmPassword) {
        MessageToast.show(this.getModel("i18n").getProperty("blankPassword"));
        return false;
      } else if (newPassword && !confirmPassword) {
        MessageToast.show(this.getModel("i18n").getProperty("blankPassword"));
        return false;
      } else if (!newPassword && !confirmPassword) {
        MessageToast.show(this.getModel("i18n").getProperty("blankFields"));
        return false;
      }
      else if (newPassword != confirmPassword) {
        MessageToast.show(this.getModel("i18n").getProperty("wrongPassword"));
        return false;
      }
      else if (newPassword.match(pattern) && confirmPassword.match(pattern)) {
        return true;
      }
      else if (!newPassword.match(pattern) || !confirmPassword.match(pattern)) {
        MessageToast.show(this.getModel("i18n").getProperty("wrongFormat"));
        return false;
      }
      else {
        MessageToast.show(this.getModel("i18n").getProperty("wrongPassword"));
        return false;
      }
    },
    onPasswordChangeOk: function () {
      let oPasswordData = this.getView().getModel("appView").getProperty("/Password");
    
      // 🔹 Generic Validation
      if (!this.validatePasswordFields(oPasswordData)) {
        return;
      }
    
      // 🔹 Save to context
      let oContext = this._oDialog.getBindingContext();
      oContext.setProperty("Password", oPasswordData.NewPassword);
    
      // 🔹 Reset flag & close
      this.addUserPress = false;
      this.UserPasswordDialog.close();
    },
    clearPasswordFields: function () {
      let oAppViewModel = this.getView().getModel("appView");
      oAppViewModel.setProperty("/Password", {
        NewPassword: "",
        ConfirmPassword: "",
        NewPasswordValueState: "None",
        NewPasswordVST: "",
        onConfirmPasswordValueState: "None",
        onConfirmPasswordVST: ""
      });
    },    
    onResetPassword: function (oEvent) {
      this._handlePasswordPopup("Reset Password", "Update");
    },
    onPasswordChangeCancel: function () {
      // 🔹 Close the Password Dialog without saving changes
      this.clearPasswordFields();
      this.UserPasswordDialog.close();
      MessageToast.show("Password change canceled.");
    },
    onUserSelect: async function (oEvent) {
      this.addUserPress = false;
      let oSelectedContext = oEvent.getSource().getBindingContext();
      this.openUserDialog("Edit User", "Update", oSelectedContext);

    },
    openUserDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oDialog) {
        this._oDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditUsers", this);
        oView.addDependent(this._oDialog);
      }

      this._oDialog.setBindingContext(oContext);
      this._oDialog.setModel(oContext.getModel());
      this._oDialog.setTitle(title);
      this.byId("idAdd").setText(button);
      this._oDialog.open();
    },
    onDeleteUser: function (oEvent) {
      var oItem = oEvent.getParameter("listItem"); // Get the list item to delete
      var oContext = oItem.getBindingContext(); // Get binding context of the item

      if (!oContext) {
        MessageToast.show("No user selected for deletion.");
        return;
      }

      MessageBox.confirm("Are you sure you want to delete this user?", {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            oContext.delete("UserChanges");
          }
        }
      });
    },
    onNewPasswordLiveChange: function (oEvent) {
      var getConfirmPass = oEvent.getParameter('value');
      var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (pattern.test(getConfirmPass)) {
        this.getView().getModel('appView').setProperty("/Password/NewPasswordValueState", "None");
        this.getView().getModel('appView').setProperty("/Password/NewPasswordVST", "");
      } else {
        this.getView().getModel('appView').setProperty("/Password/NewPasswordValueState", "Error");
        this.getView().getModel('appView').setProperty("/Password/NewPasswordVST", "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character");
      }
      this.getView().getModel('appView').setProperty("/Password/NewPassword", oEvent.getParameter("value"));
    },
    onConfirmPasswordLiveChange: function (oEvent) {
      var getConfirmPass = oEvent.getParameter('value');
      var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (pattern.test(getConfirmPass)) {
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordValueState", "None");
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordVST", "");
      } else {
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordValueState", "Error");
        this.getView().getModel('appView').setProperty("/Password/ConfirmPasswordVST", "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character");
      }
      this.getView().getModel('appView').setProperty("/Password/ConfirmPassword", getConfirmPass);
    },
    onSaveChanges: function () {
      var that = this;
      let oModel = this.getView().getModel(); // OData V4 Model

      // 🔹 Step 1: Check if there are any pending changes
      if (!oModel.hasPendingChanges()) {
        MessageToast.show("No changes detected.");
        return;
      }

      this.getModel().submitBatch("UserChanges").then(() => {
        // Retrieve all messages from the model
        const oContext = this.byId("idTableUsers").getBinding("items");
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
          MessageToast.show("User details updated successfully.");
        }
      }).catch(oError => {
        MessageBox.error("Batch request failed: " + oError.message);
      });


    },
    onRoleSelectionChange: async function (oEvent) {
      const oMCB = oEvent.getSource();
      const oContext = oMCB.getBindingContext(); // User context
      const aSelectedKeys = oEvent.getParameter("selectedItems").map(item => item.getKey());
      const oModel = oContext.getModel();
    
      const userId = oContext.getProperty("ID");
    
      // 1. Delete old UserRoles for this user
      const oldRoles = oContext.getProperty("roles");
      for (const ur of oldRoles) {
        await oModel.remove(`/UserRoles(${ur.ID})`);
      }
    
      // 2. Create new UserRoles
      for (const roleId of aSelectedKeys) {
        await oModel.create("/UserRoles", {
          user_ID: userId,
          role_ID: roleId
        });
      }
    
      // Optional: Refresh the table
      await oModel.refresh();
    },
    formatRolesForSelectedKeys: function (aRoles) {
      debugger
      if (!aRoles || !Array.isArray(aRoles)) {
        return [];
      }
    
      return aRoles.map(r => r.role.name); // or r.role.ID if your key is ID
    }
    
  });
});