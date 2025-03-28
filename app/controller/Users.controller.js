sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/ui/core/Fragment"
], function (Controller, MessageToast, MessageBox, BaseController, Fragment) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Users", {
    onInit: function () {
      this.getRouter().getRoute("Users").attachPatternMatched(this._matchedHandler, this);
      this._oODataModel = this.getView().getModel(); // OData V4 Model
    },
    _matchedHandler: function () {
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", true);   // Show back button
      oViewModel.setProperty("/LoginHeader", false);   // Show back button
      oViewModel.setProperty("/HomeScreen", true);   // Show back button
    },
    onAddUser: function () {
      this.addUserPress=true;
      let oListBinding = this.getView().byId("idTableUsers").getBinding("items");
      let oNewContext = oListBinding.create({}, true); // Creates an empty entry in deferred mode
      this.openUserDialog("Add User","Add", oNewContext);
     
    },
    onCloseEditUserDialog: function () {
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
    onSaveEditUserDialog: function () {
      let oContext = this._oDialog.getBindingContext();
      let userObject = oContext.getObject();

      // 🔹 Step 1: Validate Required Fields
      let validated = this._validateUserFields(userObject);
      if(!validated){
        return;
      }

      // 🔹 Step 2: If Adding a User, Handle Password Separately
      if (this.addUserPress) {
        this._handlePasswordPopup("Create Password", "OK");
      } else {
        // this.onPasswordChangeOk();
        this._oDialog.close();
      }
    },
    _validateUserFields: function (userObject) {
      // let errors = [];

      if (!userObject.UserName){
        MessageBox.error("Username is required.");
        return false;
      } 
      if (!userObject.RoleID_RoleID){
        MessageBox.error("Role is required.");
        return false;
      } 
      if (!userObject.CompanyID_CompanyID){
        MessageBox.error("Company is required.");
        return false;
      } 
      if (!userObject.BIAccountUser_id) {
        MessageBox.error("BI Account User ID is required.");
        return false;
      }
      return true;
      // return errors;
    },
    _handlePasswordPopup: function (title, button) {
      let oView = this.getView();
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
    onPasswordChangeOk: function (oEvent) {
      let oPasswordData = this.getView().getModel("appView").getProperty("/Password");

      // 🔹 Step 1: Validate Password
      if (!this.validatePassword(oPasswordData.NewPassword, oPasswordData.ConfirmPassword)) {
        return;
      }

      // 🔹 Step 2: Save Password in OData Context
      let oContext = this._oDialog.getBindingContext();
      oContext.setProperty("Password", oPasswordData.NewPassword);

      this.UserPasswordDialog.close();
    },
    onResetPassword: function (oEvent) {
      this._handlePasswordPopup("Reset Password", "Update");
    },
    onPasswordChangeCancel: function () {
      // 🔹 Close the Password Dialog without saving changes
      this.UserPasswordDialog.close();
      MessageToast.show("Password change canceled.");
    },
    onUserSelect: async function (oEvent) {
      this.addUserPress=false;
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
    onDeleteVendor: function (oEvent) {
      var that = this;
      var index = oEvent.getSource().getParent().getParent().getSelectedContextPaths() || [];
      oEvent.getSource().getParent().getParent().setSelectedContextPaths(null);
      if (index.length <= 0) {
        MessageToast.show(this.getView().getModel('i18n').getProperty("selectUser"));
        return;
      }
      MessageBox.confirm(this.getView().getModel('i18n').getProperty('deleteWarning'), function (sVal) {
        if (sVal === "OK") {
          let id = index[0];
          let { USER_ID } = that.getView().getModel("appView").getProperty(id);
          this.middleWare.callMiddleWare(`/Users?USER_ID=${USER_ID}`, "DELETE",).then(function () {
            MessageToast.show(that.getView().getModel('i18n').getProperty('Userdeleted'));
            that.getUsers();
          }).catch(function (oError) {
            dbAPI.errorHandler(oError, that);
          });
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
        this.getView().getModel('appView').setProperty("/Password/onConfirmPasswordValueState", "None");
        this.getView().getModel('appView').setProperty("/Password/onConfirmPasswordVST", "");
      } else {
        this.getView().getModel('appView').setProperty("/Password/onConfirmPasswordValueState", "Error");
        this.getView().getModel('appView').setProperty("/Password/onConfirmPasswordVST", "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character");
      }
    },
    onSaveChanges: function () {
      let oModel = this.getView().getModel(); // OData V4 Model

      // 🔹 Step 1: Check if there are any pending changes
      if (!oModel.hasPendingChanges()) {
        MessageToast.show("No changes detected.");
        return;
      }

      oModel.submitBatch("updateGroup").then(() => {
        MessageToast.show("User details updated successfully.");
      }).catch((oError) => {
        MessageBox.error("Error updating user: " + oError.message);
      });
    }
  });
});