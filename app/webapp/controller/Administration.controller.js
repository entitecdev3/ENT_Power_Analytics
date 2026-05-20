sap.ui.define(
  [
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "entitec/pbi/embedding/controller/BaseController",
    "sap/ui/core/Fragment",
    "entitec/pbi/embedding/model/formatter",
    "sap/ui/model/Context",
  ],
  function (
    MessageToast,
    MessageBox,
    BaseController,
    Fragment,
    formatter,
    Context
  ) {
    "use strict";

    return BaseController.extend("entitec.pbi.embedding.controller.Administration", {
      formatter: formatter,

      onInit: function () {
        this.getRouter()
          .getRoute("Administration")
          .attachPatternMatched(this._matchedHandler, this);
      },

      _matchedHandler: async function () {
        await this.setUserInfo();
        const userData = this.getModel("userInfo").getData();
        const source = userData?.referer;
        const redirectUrl = `${source}#/Apps`;
        if (source) {
          document.activeElement.blur();
          window.location.href = redirectUrl;
        }
        var oViewModel = this.getView().getModel("appView");
        oViewModel.setProperty("/navVisible", true);
        oViewModel.setProperty("/LoginHeader", false);
        oViewModel.setProperty("/HomeScreen", true);
        oViewModel.setProperty("/visSaveButton", false);
        oViewModel.setProperty("/visDiscardButton", false);
        oViewModel.setProperty('/subHeaderTitle', 'Administration');
        this.getCallData(oViewModel, this.getView().getModel(), "/Companies", "/Companies");
        this.getCallData(oViewModel, this.getView().getModel(), "/Roles", "/Roles");

        this.getModel().refresh();
      },
      onAddUser: function () {
        this.addUserPress = true;
        this.editUserPress = false;
        let oContext = this.byId('idTableRegisterUsers').getBinding("items").create({}, true, { groupId: "UserChanges" });
        this.openUserDialog("Add User", "Add", oContext);
      },
      onAddCompany: function () {
        this.addCompanyPress = true;
        this.editCompanyPress = false;
        let oContext = this.byId('idTableCompanies').getBinding("items").create({}, true, { groupId: "CompanyChanges" });
        this.openCompanyDialog("Add Company", "Add", oContext);
      },
      onRefreshUsers: function () {
        var that = this;
        let oModel = this.getView().getModel();
        if (oModel.hasPendingChanges('UserChanges')) {
          MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                oModel.resetChanges("UserChanges");
                oModel.refresh();
                that.visSaveDiscardButton('UserChanges');
                that.onChangeHighlightTableRow("idTableRegisterUsers"); // Track changes in row and highlight them
              }
            }
          });
        } else {
          that.onChangeHighlightTableRow("idTableRegisterUsers"); // Track changes in row and highlight them
          oModel.resetChanges("UserChanges");
          oModel.refresh();
        }
      },
      onRefreshCompanies: function () {
        var that = this;
        let oModel = this.getView().getModel();
        if (oModel.hasPendingChanges('CompanyChanges')) {
          MessageBox.warning("Are you sure you want to reload. Your changes will be lost?", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                oModel.resetChanges("CompanyChanges");
                oModel.refresh();
                that.visSaveDiscardButton('CompanyChanges');
                that.onChangeHighlightTableRow("idTableCompanies"); // Track changes in row and highlight them
              }
            }
          });
        } else {
          that.onChangeHighlightTableRow("idTableCompanies"); // Track changes in row and highlight them
          oModel.resetChanges("CompanyChanges");
          oModel.refresh();
        }
      },
      onCloseEditUserDialog: function (oEvent) {
        let oContext = oEvent.getSource().getBindingContext();
        if (oContext.hasPendingChanges("UserChanges") && !oContext.isTransient()) {
          Object.keys(this._oSelectedUserObject).forEach((key) => {
            oContext.setProperty(key, this._oSelectedUserObject[key]);
          })
        } else {
          if (oContext.isTransient()) {
            oContext.delete();
          }
        }
        this.onChangeHighlightTableRow("idTableRegisterUsers"); // Track changes in row and highlight them
        this._oDialog.close();
      },
      onCloseEditCompanyDialog: function (oEvent) {
        let oContext = oEvent.getSource().getBindingContext();
        if (oContext.hasPendingChanges("CompanyChanges") && !oContext.isTransient()) {
          Object.keys(this._oSelectedCompanyObject).forEach((key) => {
            oContext.setProperty(key, this._oSelectedCompanyObject[key]);
          })
        } else {
          if (oContext.isTransient()) {
            oContext.delete();
          }
        }
        this.onChangeHighlightTableRow("idTableCompanies"); // Track changes in row and highlight them
        this._oCompanyDialog.close();
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
          this.onChangeHighlightTableRow("idTableRegisterUsers"); // Track changes in row and highlight them
          this.visSaveDiscardButton("UserChanges")
        }
      },
      onSaveEditCompanyDialog: async function () {
        // let oContext = this.bindingContext || this._oDialog.getBindingContext();
        this._oCompanyDialog.close();
        if (this.getModel().hasPendingChanges()) {
          this.onChangeHighlightTableRow("idTableCompanies"); // Track changes in row and highlight them
          this.visSaveDiscardButton("CompanyChanges")
        }
      },
      _validateUserFields: async function (userObject) {
        const isValid = await this.validateEntityFields("Users", userObject);
        if (!isValid) return false;
        return true;
      },
      _validateCompanyFields: async function (userObject) {
        const isValid = await this.validateEntityFields("Companies", userObject);
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
      onPasswordChangeCancel: function () {
        this.clearPasswordFields();
        this.UserPasswordDialog.close();
        MessageToast.show(this.getModel("i18n").getProperty("passwordChangeCanceled"));
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
        if (this.getView().getModel().hasPendingChanges('UserChanges')) {
          this.visSaveDiscardButton('UserChanges');
          this.onChangeHighlightTableRow("idTableRegisterUsers"); // Track changes in row and highlight them
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
        MessageToast.show(this.getModel("i18n").getProperty("passwordChangeCanceled"));
      },
      onUserSelect: async function (oEvent) {
        this.addUserPress = false;
        this.editUserPress = true;
        this.bindingContext = oEvent.getSource().getBindingContext();
        this.openUserDialog("Edit User", "Update", this.bindingContext);
        this._oSelectedUserObject = JSON.parse(JSON.stringify(this.bindingContext.getObject()));
      },
      onCompanySelect: async function (oEvent) {
        this.addCompanyPress = false;
        this.editCompanyPress = true;
        this.bindingContext = oEvent.getSource().getBindingContext();
        this.openCompanyDialog("Edit Company", "Update", this.bindingContext);
        this._oSelectedCompanyObject = JSON.parse(JSON.stringify(this.bindingContext.getObject()));
      },
      openUserDialog: function (title, button, oContext) {
        let oView = this.getView();
        if (!this._oDialog) {
          this._oDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditUsers", this);
          oView.addDependent(this._oDialog);
        }
        this.bindingContext = oContext;
        this._oDialog.setTitle(title);
        this._oDialog.setBindingContext(oContext);
        this._oDialog.open();
      },
      openCompanyDialog: function (title, button, oContext) {
        let oView = this.getView();
        if (!this._oCompanyDialog) {
          this._oCompanyDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.EditCompanies", this);
          oView.addDependent(this._oCompanyDialog);
        }
        this.bindingContext = oContext;
        this._oCompanyDialog.setTitle(title);
        this._oCompanyDialog.setBindingContext(oContext);
        this._oCompanyDialog.open();
      },
      onSaveChanges: async function () {
        var that = this;
        let oIconTabBar = this.byId("idAdministrationMenu");
        let oModel = this.getView().getModel();
        let sSelectedKey = oIconTabBar.getSelectedKey();

        if (sSelectedKey.includes("users")) {
          // Service Principal batch
          if (!oModel.hasPendingChanges("UserChanges")) {
            MessageToast.show("No changes detected.");
            return;
          }
          this.getModel()
            .submitBatch("UserChanges")
            .then(() => {
              const oContext = this.byId("idTableRegisterUsers").getBinding("items");
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
                  that.visSaveDiscardButton('UserChanges');
                  that.onChangeHighlightTableRow("idTableRegisterUsers"); // Changing the status of the table row
                  that.getCallData(that.getView().getModel('appView'), that.getView().getModel(), "/Users", "/UserData");
                }
              } else {
                MessageToast.show(
                  "User details updated successfully."
                );
                that.visSaveDiscardButton('UserChanges')
                that.onChangeHighlightTableRow("idTableRegisterUsers"); // Changing the status of the table row
                that.getCallData(that.getView().getModel('appView'), that.getView().getModel(), "/Users", "/UserData");
              }
            })
            .catch((oError) => {
              MessageBox.error("Batch request failed: " + oError.message);
            });
        } else if (sSelectedKey.includes("companies")) {
          // Report batch
          if (!oModel.hasPendingChanges("CompanyChanges")) {
            MessageToast.show("No changes detected.");
            return;
          }
          this.getModel()
            .submitBatch("CompanyChanges")
            .then(() => {
              const oContext =
                this.byId("idTableCompanies").getBinding("items");
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
                  that.onChangeHighlightTableRow('idTableCompanies');
                  that.visSaveDiscardButton('CompanyChanges')
                }
              } else {
                MessageToast.show("Company details updated successfully.");
                if (!that.addReport) {
                  oModel.refresh();
                }
                that.onChangeHighlightTableRow('idTableCompanies');
                that.visSaveDiscardButton('CompanyChanges')
              }
            })
            .catch((oError) => {
              MessageBox.error("Batch request failed: " + oError.message);
            });
        } 


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
              if (that.getView().getModel().hasPendingChanges('UserChanges')) {
                that.visSaveDiscardButton('UserChanges')
              }
            }
          }
        });
      },
      onDeleteCompany: function (oEvent) {
        var that = this;
        var oItem = oEvent.getParameter("listItem"); // Get the list item to delete
        var oContext = oItem.getBindingContext(); // Get binding context of the item

        if (!oContext) {
          MessageToast.show("No company selected for deletion.");
          return;
        }

        MessageBox.confirm("Are you sure you want to delete this company?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oContext.delete("CompanyChanges");
              if (that.getView().getModel().hasPendingChanges('CompanyChanges')) {
                that.visSaveDiscardButton('CompanyChanges')
              }
            }
          }
        });
      },
      onDiscardChanges: function () {
        let oIconTabBar = this.byId("idAdministrationMenu");
        let sSelectedKey = oIconTabBar.getSelectedKey();
        let oModel = this.getView().getModel();

        if (sSelectedKey.includes("users")) {
          this.showDiscardChangesWarning(
            "Are you sure you want to discard your changes?",
            null,
            oModel,
            "UserChanges",
            this,
            ["visDiscardButton", "visSaveButton"],
            "idTableRegisterUsers"
          );
        } else if (sSelectedKey.includes("companies")) {
          this.showDiscardChangesWarning(
            "Are you sure you want to discard your changes?",
            null,
            oModel,
            "CompanyChanges",
            this,
            ["visDiscardButton", "visSaveButton"],
            "idTableCompanies"
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
            if (sAction === MessageBox.Action.CANCEL && cancelFunction) {
              cancelFunction();
            }
          },
        });
      },
      onIconTabBarChange: function (oEvent) {
        let oModel = this.getView().getModel(),
          previousKey = oEvent.getParameter('previousKey');

        const cancelFunction = () => {
          this.byId("idAdministrationMenu").setSelectedKey(previousKey)
        }


        if (previousKey.includes("users")) {
          // 1. Check if there is any pending changes in the model 
          let bChange = oModel.hasPendingChanges('UserChanges');
          // 2. show the warning msg box
          if (bChange) {
            // 3. if Ok then discard all the changes and navigate to the selected tab
            this.showDiscardChangesWarning(
              "You have unsaved changes. Press OK to discard them and proceed, or Cancel to go back and save your changes.",
              null,
              oModel,
              "UserChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idTableRegisterUsers",
              cancelFunction.bind(this)
            );
          }
        } else if (previousKey.includes("companies")) {
          // 1. Check if there is any pending changes in the model 
          let bChange = oModel.hasPendingChanges('CompanyChanges');
          // 2. show the warning msg box
          if (bChange) {
            // 3. if Ok then discard all the changes and navigate to the selected tab
            this.showDiscardChangesWarning(
              "You have unsaved changes. Press OK to discard them and proceed, or Cancel to go back and save your changes.",
              null,
              oModel,
              "CompanyChanges",
              this,
              ["visDiscardButton", "visSaveButton"],
              "idTableCompanies",
              cancelFunction.bind(this)
            );
          }
        }
      }
    });
  });
