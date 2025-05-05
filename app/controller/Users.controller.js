sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "entitec/pbi/embedding/controller/BaseController",
  "sap/ui/core/Fragment",
  "entitec/pbi/embedding/model/formatter",
  "sap/ui/model/Context"
], function (Controller, MessageToast, MessageBox, BaseController, Fragment, formatter, Context) {
  "use strict";

  return BaseController.extend("entitec.pbi.embedding.controller.Users", {
    formatter: formatter,

    onInit: function () {
      this.getRouter().getRoute("Users").attachPatternMatched(this._matchedHandler, this);
    },

    _matchedHandler: function () {
      var oViewModel = this.getView().getModel("appView");
      oViewModel.setProperty("/navVisible", true);
      oViewModel.setProperty("/LoginHeader", false);
      oViewModel.setProperty("/HomeScreen", true);
      this.getModel().refresh();
    },

    onAddUser: function () {
      this.addUserPress = true;
      let oView = this.getView();
      // let oAppModel = this.getModel("appView");
      // oAppModel.setProperty("/NewsUser", {
      //   "username": "test",
      //   "roles": [],
      //   "company": { "ID": null }
      // });
      // Create a new empty entry with default values
      const oNewUser = {
        "User": {
          username: "",
          company: {
            ID: ""
          },
          roles: []
        }
      };

      // Create a new context for the dialog (optional - using a JSON model)
      const oTempModel = new sap.ui.model.json.JSONModel(oNewUser);
      oView.setModel(oTempModel, "tempUser")
      let oNewContext = new Context(oTempModel, "/User");
      // let oNewContext = new Context(oAppModel, "/NewUser");
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
      let userObject = this._oDialog.getModel("tempUser").getProperty("/User");
      userObject.company_ID = userObject.company.ID;
      
      // let userObject = oContext.getObject();      
      // let skipFields = ["password"];


      debugger;
      if (this.addUserPress) {
        await this._handlePasswordPopup("Create Password", "OK", userObject);
      } else {
        this._oDialog.close();
      }

      const oTable = this.byId("idTableUsers").getBinding("items");
      
      if(this.userObject.password){
        this.aUserTableCreateContext=oTable.create(this.userObject);
        this.aUserTableCreateContext.created().then(function(x,y,z){debugger})
      }
    },
    _validateUserFields: async function (userObject) {

      const isValid = await this.validateEntityFields("Users", userObject);
      if (!isValid) return false;
      return true;

    },
    handleMultiComboSelectionFinish: function (oEvent) {
      debugger;
      var aSelectedItem = oEvent.getParameter("selectedItems");
      var aRoles = [];
      for (let index = 0; index < aSelectedItem.length; index++) {
        const element = aSelectedItem[index];
        aRoles.push({
          // role:{
          //   ID:element.getBindingContext().getProperty("role/ID"),
          //   name:element.getBindingContext().getProperty("role/name")
          // }, 
          // ID:element.getBindingContext().getProperty("ID"),
          role_ID: element.getBindingContext().getProperty("ID"),
        })
      }
      this.getView().getModel("tempUser").setProperty("/User/roles", aRoles)
    },
    _handlePasswordPopup: function (title, button, userObject) {
      let oView = this.getView();
      this.userObject = userObject;
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
    onPasswordChangeOk: async function () {
      let oPasswordData = this.getView().getModel("appView").getProperty("/Password");

      if (!this.validatePassword(oPasswordData.NewPassword, oPasswordData.ConfirmPassword)) {
        return;
      }
      this.userObject.password=oPasswordData.NewPassword;
      let skipFields = [];
      let validated = await this.validateEntityFields("Users", this.userObject, skipFields);
      if (!validated) {
        return;
      }
         
      
      // let oContext = this._oDialog.getBindingContext();
      // let oContext = this.aUserTableCreateContext;
      // oContext.setProperty("password", oPasswordData.NewPassword);

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
      let oView = this.getView();
      let oSelectedContext = oEvent.getSource().getBindingContext();
      const oNewUser = { "User": oSelectedContext.getObject() };

      // Create a new context for the dialog (optional - using a JSON model)
      const oTempModel = new sap.ui.model.json.JSONModel(oNewUser);
      oView.setModel(oTempModel, "tempUser")
      let oNewContext = new Context(oTempModel, "/User");
      this.openUserDialog("Edit User", "Update", oNewContext);

    },
    openUserDialog: function (title, button, oContext) {
      let oView = this.getView();
      if (!this._oDialog) {
        this._oDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditUsers", this);
        oView.addDependent(this._oDialog);
      }

      // this._oDialog.setBindingContext(null);
      // this._oDialog.setBindingContext(oContext);
      // this._oDialog.setElementBindingContext(oContext)
      // this._oDialog.unbindElement();
      // this._oDialog.setModel(oContext.getModel());
      // this.byId("idRolesMultiCombo").bindItems({
      //   path: "/Roles",
      //   model: undefined, // use root
      //   template: new sap.ui.core.Item({
      //     key: "{ID}",
      //     text: "{name}"
      //   })
      // });

      // if (this.addUserPress) {
      //   this._oDialog.bindElement({
      //     path: oContext.getPath(),
      //     model:oContext.getModel(),
      //     parameters: {
      //       $$updateGroupId: "UserChanges"
      //     }
      //   });
      // }

      this._oDialog.setTitle(title);
      this.byId("idAdd").setText(button);
      let oRoles = oContext.getObject().roles;
      if (oRoles) {
        let aRoles = oRoles.map(role => role.ID);
        // let aRoles = oRoles.map(role => role.role.ID);
        this.byId("idRolesMultiCombo").setSelectedKeys(aRoles);
      } else {
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
      let oModel = this.getView().getModel();
      if (!oModel.hasPendingChanges("UserChanges")) {
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