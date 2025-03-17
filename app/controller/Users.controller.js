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
    },
    _matchedHandler: function () {
      this.getCustomData();
      this.getUsers();
      this.getB1Companies();
      this.getB1AccountUsers();
      this.getModel("appView").setProperty("/navVisible", true);
    },
    getB1Companies: function () {
      var that = this;
      this.middleWare.callMiddleWare("/B1Companies", "GET")
        .then(function (data) {
          that.getModel("appView").setProperty("/B1Companies", data);
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    getB1AccountUsers: function () {
      var that = this;
      this.middleWare.callMiddleWare("/B1AccountUsers", "GET")
        .then(function (data) {
          that.getModel("appView").setProperty("/B1AccountUsers", data);
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    getUsers: function () {
      var that = this;
      this.middleWare.callMiddleWare("/Users", "GET")
        .then(function (data) {
          that.getModel("appView").setProperty("/Users", data);
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    onAddUserPress: function () {
      var that = this;
      var oView = this.getView();
      this.addUserPress = true;
      this.getView().getModel("appView").setProperty("/addUser", that.addUserPress);
      if (!this.UserEditDialog) {
        this.UserEditDialog = Fragment.load({
          id: oView.getId(),
          name: "entitec.pbi.embedding.fragments.EditUsers",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this.UserEditDialog.then(async function (oDialog) {
        let userDataObject = {
          USERNAME: null,
          ROLE_ID: null,
          COMPANY_ID: null,
          BIACCOUNTUSER: null,
        }
        that.getView().getModel("appView").setProperty("/userData", userDataObject);
        oDialog.open();
      });
    },
    onCloseEditUserDialog: function () {
      this.addUserPress = false;
      this.getView().getModel("appView").setProperty("/addUser", this.addUserPress);
      this.UserEditDialog.then(async function (oDialog) {
        oDialog.close();
      });
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
      var that = this;
      var oView = this.getView();
      let userData = this.getView().getModel("appView").getProperty("/userData");
      if (!userData.USERNAME || !userData.ROLE_ID || !userData.COMPANY_ID || !userData.BIACCOUNTUSER) {
        MessageToast.show(that.getView().getModel("i18n").getProperty("requiredFieldsNotPresent"))
        return;
      }
      if (this.addUserPress) {
        if (!this.UserPasswordDialog) {
          this.UserPasswordDialog = Fragment.load({
            id: oView.getId(),
            name: "entitec.pbi.embedding.fragments.Password",
            controller: this
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.UserPasswordDialog.then(async function (oDialog) {
          let userDataObject = {
            NewPassword: null,
            ConfirmPassword: null,
            NewPasswordValueState: null,
            NewPasswordVST: null,
            ConfirmPasswordValueState: null,
            ConfirmPasswordVST: null,
          }
          that.getView().getModel("appView").setProperty("/Password", userDataObject);
          oDialog.open();
        });
      } else {
        this.onPasswordChangeOk();
      }
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
      var that = this;
      let sBtnText = "";
      let userData = this.getView().getModel("appView").getProperty("/userData");
      if(oEvent){
        sBtnText = oEvent.getSource().getProperty('text');
      }
      if(sBtnText === 'Update'){
        let { NewPassword, ConfirmPassword } = this.getView().getModel("appView").getProperty("/Password");
        let bValidated = this.validatePassword(NewPassword, ConfirmPassword);
        if (bValidated) {
          this.middleWare.callMiddleWare("/resetPassword", "PATCH", {PASSWORD :NewPassword, USER_ID : userData.USER_ID})
          .then(function (data) {
            that.UserPasswordDialog.then(async function (oDialog) {
              oDialog.close();
            });
          }).catch(function (oError) {
            that.middleWare.errorHandler(oError, that);
          });
        }
        return;
      }
      if (this.addUserPress) {
        let { NewPassword, ConfirmPassword } = this.getView().getModel("appView").getProperty("/Password");
        let bValidated = this.validatePassword(NewPassword, ConfirmPassword);
        if (bValidated) {
          this.UserPasswordDialog.then(async function (oDialog) {
            oDialog.close();
          });
          userData.PASSWORD = NewPassword;
        }
      }
      this.middleWare.callMiddleWare("/Users", "POST", userData)
        .then(function (data) {
          that.getUsers();
          that.UserEditDialog.then(async function (oDialog) {
            oDialog.close();
          });
        }).catch(function (oError) {
          that.middleWare.errorHandler(oError, that);
        });
    },
    onResetPassword: function (oEvent) {
      var that = this;
      var oView = this.getView();
      debugger;
      let sPath = oEvent.getSource().getBindingContext('appView').getPath();
      let userData = this.getView().getModel('appView').getProperty(sPath);
      this.getView().getModel("appView").setProperty("/userData", userData);
      if (!this.UserPasswordDialog) {
        this.UserPasswordDialog = Fragment.load({
          id: oView.getId(),
          name: "entitec.pbi.embedding.fragments.Password",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this.UserPasswordDialog.then(async function (oDialog) {
        let userDataObject = {
          NewPassword: null,
          ConfirmPassword: null,
          NewPasswordValueState: null,
          NewPasswordVST: null,
          ConfirmPasswordValueState: null,
          ConfirmPasswordVST: null,
        }
        that.getView().getModel("appView").setProperty("/Password", userDataObject);
        oDialog.open();
      });
    },
    onPasswordChangeCancel: function () {
      var that = this;
      this.UserPasswordDialog.then(async function (oDialog) {
        that.getView().getModel("appView").setProperty("/Password", null);
        oDialog.close();
      });
    },
    onUserSelect: async function (oEvent) {
      var that = this;
      this.addUserPress = false;
      this.getView().getModel("appView").setProperty("/addUser", that.addUserPress);
      var userObject = oEvent.getParameter('listItem').getBindingContext("appView").getObject();
      var oView = this.getView();
      if (!this.UserEditDialog) {
        this.UserEditDialog = Fragment.load({
          id: oView.getId(),
          name: "entitec.pbi.embedding.fragments.EditUsers",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this.UserEditDialog.then(async function (oDialog) {
        that.getView().getModel("appView").setProperty("/userData", userObject);
        oDialog.open();
      });
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
  });
});