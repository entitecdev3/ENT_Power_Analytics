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
      this._oODataModel = this.getView().getModel(); 

    },

    _matchedHandler: function () {
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", true);   
      oViewModel.setProperty("/LoginHeader", false); 
      oViewModel.setProperty("/HomeScreen", true); 
    },

    onAddUser: function () {
      this.addUserPress = true;
      let oListBinding = this.getView().byId("idTableUsers").getBinding("items"); 
      let oNewContext = oListBinding.create({}, true, { groupId: "UserChanges" });
      this.openUserDialog("Add User", "Add", oNewContext);
    },
    onRefreshUsers: function () {
      
      if (this._oODataModel.hasPendingChanges()) {
        MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              this._oODataModel.resetChanges("UserChanges");
              this._oODataModel.refresh();
            }
          }
        });
      } else {
        this._oODataModel.resetChanges("UserChanges");
        this._oODataModel.refresh();
      }
    },
    onCloseEditUserDialog: function () {
      
      this._oODataModel.resetChanges("UserChanges");
      this._oDialog.close();
    },
    onAccountNewPasswordLiveChange: function (oEvent) {
      var getConfirmPass = oEvent.getParameter('value');
      var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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

      let skipFields = ["Password"];

      let validated = await this.validateEntityFields("Users", userObject, skipFields);
      if (!validated) {
        return;
      }

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

      let appModel = oView.getModel("appView");
      if (!appModel.getProperty("/Password")) {
        appModel.setProperty("/Password", {
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

      if (!this.validatePassword(oPasswordData)) {
        return;
      }

      let oContext = this._oDialog.getBindingContext();
      oContext.setProperty("Password", oPasswordData.NewPassword);

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
      let oRoles = oContext.getObject().roles;
      if (oRoles) {
        let aRoles = oRoles.map(role => role.role.ID);
        this.byId("idRolesMultiCombo").setSelectedKeys(aRoles);
      }else{
        this.byId("idRolesMultiCombo").setSelectedKeys([]);
      }
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
      if (!this._oODataModel.hasPendingChanges()) {
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
          MessageToast.show("User details updated successfully.");
        }
      }).catch(oError => {
        MessageBox.error("Batch request failed: " + oError.message);
      });


    },
    
    formatSelectedRoles: function (aRoles) {
      if (!aRoles) return [];
      return aRoles.map(role => role.role.ID); 
    }


  });
});