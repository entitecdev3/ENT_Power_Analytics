sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "entitec/pbi/embedding/controller/BaseController",
    "sap/ui/core/Fragment",
    "entitec/pbi/embedding/model/formatter",
    "sap/ui/model/Context",
  ],
  function (
    Controller,
    MessageToast,
    MessageBox,
    BaseController,
    Fragment,
    formatter,
    Context
  ) {
    "use strict";

    return BaseController.extend("entitec.pbi.embedding.controller.Users", {
      formatter: formatter,

      onInit: function () {
        this.getRouter()
          .getRoute("Users")
          .attachPatternMatched(this._matchedHandler, this);
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
        this.editUserPress = false;
        let oContext = this.byId('idTableUsers').getBinding("items").create({});
        oContext.created().then(function (x, y, z) { debugger });
        this.openUserDialog("Add User", "Add", oContext);
      },
      onRefreshUsers: function () {
        var that = this;
        let oModel = this.getView().getModel();
        if (oModel.hasPendingChanges()) {
          MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                that.byId('idSaveUsers').setEnabled(false);
                that.byId('idDiscardButton').setEnabled(false);
                oModel.resetChanges("UserChanges");
                oModel.refresh();
              }
            }
          });
        } else {
          that.byId('idSaveUsers').setEnabled(false);
          that.byId('idDiscardButton').setEnabled(false);
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
        let oContext = this.bindingContext || this._oDialog.getBindingContext();
        if (this.addUserPress) {
          this.clearPasswordFields();
          await this._handlePasswordPopup("Create Password", "OK", oContext);
          this._oDialog.close();
        }
        else {
          this._oDialog.close();
        }
        if (this.getModel().hasPendingChanges()) {
          this.byId('idSaveUsers').setEnabled(true);
          this.byId('idDiscardButton').setEnabled(true);
        }
      },
      _validateUserFields: async function (userObject) {

        if (this.addUserPress) {
          this.aUserTableCreateContext = oTable.create(this.userObject);
          this.aUserTableCreateContext.created().then(function (x, y, z) {
            debugger;
          });
        } else if (this._oSelectedContext) {
          // Update only the UI with setProperty
          Object.keys(userObject).forEach(key => {
            this._oSelectedContext.setProperty(key, userObject[key]);
          });
        }
        this._oDialog.close();
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
            NewPasswordVST: "",
            onConfirmPasswordValueState: "None",
            onConfirmPasswordVST: "",
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
      onResetPassword: function (oEvent) {
        this._handlePasswordPopup("Reset Password", "Update");
      },
      onPasswordChangeCancel: function () {
        this.clearPasswordFields();
        this.UserPasswordDialog.close();
        MessageToast.show("Password change canceled.");
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
        let oContext = this.bindingContext || this._oDialog?.getBindingContext();
        oContext.setProperty("password", oPasswordData.NewPassword);

        this.addUserPress = false;
        this.UserPasswordDialog.close();
        if (this.getView().getModel().hasPendingChanges()) {
          this.byId('idSaveUsers').setEnabled(true);
          this.byId('idDiscardButton').setEnabled(true);
        }
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
        this.editUserPress = true;
        this.bindingContext = oEvent.getSource().getBindingContext();
        this._handlePasswordPopup("Reset Password", "Update", this.bindingContext);
      },
      onPasswordChangeCancel: function () {
        this.clearPasswordFields();
        this.UserPasswordDialog.close();
        MessageToast.show("Password change canceled.");
      },
      onUserSelect: async function (oEvent) {
        this.addUserPress = false;
        this.editUserPress = true;
        this.bindingContext = oEvent.getSource().getBindingContext();
        this.openUserDialog("Edit User", "Update", this.bindingContext);

      },
      openUserDialog: function (title, button, oContext) {
        let oView = this.getView();
        if (!this._oDialog) {
          this._oDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditUsers", this);
          oView.addDependent(this._oDialog);
        }
        this.bindingContext = oContext;
        this._oDialog.setTitle(title);
        // this.byId("idAdd").setText(button);
        this._oDialog.setBindingContext(oContext);
        this._oDialog.open();
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
            this.byId('idSaveUsers').setEnabled(false);
            this.byId('idDiscardButton').setEnabled(false);
            MessageToast.show("User details updated successfully.");
            // oModel.refresh();
          }
        }).catch(oError => {
          MessageBox.error("Batch request failed: " + oError.message);
        });


      },
      onDeleteUser: function (oEvent) {
        var that = this;
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
              if (that.getView().getModel().hasPendingChanges()) {
                that.byId('idSaveUsers').setEnabled(true);
                that.byId('idDiscardButton').setEnabled(true);
              }
            }
          }
        });
      },
      onDiscardChanges: function () {
        let that = this;
        let oModel = this.getView().getModel();
        if (oModel.hasPendingChanges("UserChanges")) {
          MessageBox.confirm("Are you sure you want to discard the changes?", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                that.byId('idSaveUsers').setEnabled(false);
                that.byId('idDiscardButton').setEnabled(false);
                oModel.resetChanges("UserChanges");
                oModel.refresh();
              }
            }
          });
        } else {
          MessageToast.show("No changes to discard.");
        }
      }
    });
  });
