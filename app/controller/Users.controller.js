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
            ID: "",
            roles: [],
          },
        }
      };

      // let oContext = this.byId('idTableUsers').getBinding("items").create({});

      // Create a new context for the dialog (optional - using a JSON model)
      const oTempModel = new sap.ui.model.json.JSONModel(oNewUser);
      oView.setModel(oTempModel, "tempUser")
      let oNewContext = new Context(oTempModel, "/User");
      // let oNewContext = new Context(oAppModel, "/NewUser");
      this.openUserDialog("Add User", "Add", oNewContext);
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
              oModel.resetChanges("UserChanges");
              oModel.refresh();
            }
          }
        });
      } else {
        that.byId('idSaveUsers').setEnabled(false);
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
        this.clearPasswordFields();
        await this._handlePasswordPopup("Create Password", "OK", userObject);
      } 
      else {
        if (this.editUserPress) {
          debugger
          if(this.editBindingContext.getProperty("username") !== userObject.username){
            this.editBindingContext.setProperty("username", userObject.username);
          }
          if(this.editBindingContext.getObject().company.ID !== userObject.company.ID){
            this.editBindingContext.setProperty("company_ID", userObject.company.ID);
          }
          
          if(this.hasChangesInRoles){
            const oModel = this.getView().getModel();
            const oContextBinding = oModel.bindContext(`/updateRoles(...)`);
            oContextBinding.setParameter("roles", userObject.roles.map(role => role.role_ID));
            oContextBinding.setParameter("userId", userObject.ID);
            await oContextBinding.execute().then(() => {
              this.hasChangesInRoles = false;
              if(!oModel.hasPendingChanges()){
                oModel.refresh();
              }
              // MessageToast.show("Roles updated successfully.");
            }).catch((reject) => {
              // MessageToast.show("Failed to update roles.");
            });
          }
        }
        this._oDialog.close();
      }
    },
      onAccountNewPasswordLiveChange: function (oEvent) {
        var getConfirmPass = oEvent.getParameter("value");
        var pattern =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (pattern.test(getConfirmPass)) {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/NewPasswordValueState", "None");
          this.getView()
            .getModel("appView")
            .setProperty("/Password/NewPasswordVST", "");
        } else {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/NewPasswordValueState", "Error");
          this.getView()
            .getModel("appView")
            .setProperty(
              "/Password/NewPasswordVST",
              "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character"
            );
        }
      },
      onAccountConfirmPasswordLiveChange: function (oEvent) {
        var getConfirmPass = oEvent.getParameter("value");
        var pattern =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (pattern.test(getConfirmPass)) {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/ConfirmPasswordValueState", "None");
          this.getView()
            .getModel("appView")
            .setProperty("/Password/ConfirmPasswordVST", "");
        } else {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/ConfirmPasswordValueState", "Error");
          this.getView()
            .getModel("appView")
            .setProperty(
              "/Password/ConfirmPasswordVST",
              "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character"
            );
        }
      },
      onSaveEditUserDialog: async function () {
        let oContext = this._oDialog.getBindingContext();
        let userObject = this._oDialog
          .getModel("tempUser")
          .getProperty("/User");
        userObject.company_ID = userObject.company.ID;

      const oTable = this.byId("idTableUsers").getBinding("items");
      
      if(!this.editUserPress && this.userObject.password){
        this.aUserTableCreateContext=oTable.create(this.userObject);
        this.aUserTableCreateContext.created().then(function(x,y,z){debugger})
      }

      if(this.getModel().hasPendingChanges()){
        this.byId('idSaveUsers').setEnabled(true);
      }
    },
    _validateUserFields: async function (userObject) {

        if (this.addUserPress) {
          this.aUserTableCreateContext = oTable.create(this.userObject);
          this.aUserTableCreateContext.created().then(function (x, y, z) {
            debugger;
          });
        }else if (this._oSelectedContext) {
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
          });
        }
        this.getView().getModel("tempUser").setProperty("/User/roles", aRoles);
      },
    //   _handlePasswordPopup: function (title, button, userObject) {
    //     let oView = this.getView();
    //     this.userObject = userObject;
    //     let appModel = oView.getModel("appView");
    //     if (!appModel.getProperty("/Password")) {
    //       appModel.setProperty("/Password", {
    //         NewPassword: "",
    //         ConfirmPassword: "",
    //         NewPasswordValueState: "None",
    //         ConfirmPasswordValueState: "None",
    //       });
    //     }

    // },
    handleMultiComboSelectionFinish: function (oEvent) {
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
      this.hasChangesInRoles = true;
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
          NewPasswordVST: "",
          onConfirmPasswordValueState: "None",
          onConfirmPasswordVST: "",
        });
      }
    },
      onResetPassword: function (oEvent) {
        this._handlePasswordPopup("Reset Password", "Update");
      },
      onPasswordChangeCancel: function () {
        this.clearPasswordFields();
        this.UserPasswordDialog.close();
        MessageToast.show("Password change canceled.");
      },
    //   onUserSelect: async function (oEvent) {
    //     this.addUserPress = false;
    //     let oView = this.getView();
    //     let oSelectedContext = oEvent.getSource().getBindingContext();
    //     this._oSelectedContext = oSelectedContext; // store globally
    //     const oNewUser = { User: oSelectedContext.getObject() };

    //   if (!this.UserPasswordDialog) {
    //     this.UserPasswordDialog = sap.ui.xmlfragment(oView.getId(), "entitec.pbi.embedding.fragments.Password", this);
    //     oView.addDependent(this.UserPasswordDialog);
    //   }
    //   this.UserPasswordDialog.setTitle(title);
    //   this.byId("idPasswordSave").setText(button);
    //   this.UserPasswordDialog.open();
    // },
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
      this.userObject.company_ID = this.userObject.company.ID;
      let skipFields = [];
      let validated = await this.validateEntityFields("Users", this.userObject, skipFields);
      if (!validated) {
        return;
      }
         
      if (this.editUserPress) {
        this.editBindingContext.setProperty("password", this.userObject.password);
      }
      // let oContext = this._oDialog.getBindingContext();
      // let oContext = this.aUserTableCreateContext;
      // oContext.setProperty("password", oPasswordData.NewPassword);

      this.addUserPress = false;
      this.UserPasswordDialog.close();

      if(this.getView().getModel().hasPendingChanges()){
        this.byId('idSaveUsers').setEnabled(true);
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
    onResetPassword: function (oEvent) {8887
      this.editUserPress = true;
      this.editBindingContext = oEvent.getSource().getBindingContext();
      this._handlePasswordPopup("Reset Password", "Update", this.editBindingContext.getObject());
    },
    onPasswordChangeCancel: function () {
      this.clearPasswordFields();
      this.UserPasswordDialog.close();
      MessageToast.show("Password change canceled.");
    },
    onUserSelect: async function (oEvent) {
      this.addUserPress = false;
      this.editUserPress = true;
      let oView = this.getView();
      let oSelectedContext = oEvent.getSource().getBindingContext();
      if (oSelectedContext){
        this.editBindingContext = oSelectedContext;
      }
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
        let aRoles = this.formatSelectedRoles(oRoles);
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

        this._oDialog.setTitle(title);
        this.byId("idAdd").setText(button);
        let oRoles = oContext.getObject().roles;
        if (oRoles) {
          let aRoles = oRoles.map((role) => role.role.ID);
          // let aRoles = oRoles.map(role => role.role.ID);
          this.byId("idRolesMultiCombo").setSelectedKeys(aRoles);
        } else {
          this.byId('idSaveUsers').setEnabled(false);
          MessageToast.show("User details updated successfully.");
          oModel.refresh();
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
          },
        });
      },
      onNewPasswordLiveChange: function (oEvent) {
        var getConfirmPass = oEvent.getParameter("value");
        var pattern =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (pattern.test(getConfirmPass)) {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/NewPasswordValueState", "None");
          this.getView()
            .getModel("appView")
            .setProperty("/Password/NewPasswordVST", "");
        } else {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/NewPasswordValueState", "Error");
          this.getView()
            .getModel("appView")
            .setProperty(
              "/Password/NewPasswordVST",
              "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character"
            );
        }
        this.getView()
          .getModel("appView")
          .setProperty("/Password/NewPassword", oEvent.getParameter("value"));
      },
      onConfirmPasswordLiveChange: function (oEvent) {
        var getConfirmPass = oEvent.getParameter("value");
        var pattern =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (pattern.test(getConfirmPass)) {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/ConfirmPasswordValueState", "None");
          this.getView()
            .getModel("appView")
            .setProperty("/Password/ConfirmPasswordVST", "");
        } else {
          this.getView()
            .getModel("appView")
            .setProperty("/Password/ConfirmPasswordValueState", "Error");
          this.getView()
            .getModel("appView")
            .setProperty(
              "/Password/ConfirmPasswordVST",
              "Password must contain atleast 8 characters,\n including Upper/lowercase, numbers,\n and special character"
            );
        }
        this.getView()
          .getModel("appView")
          .setProperty("/Password/ConfirmPassword", getConfirmPass);
      },
      onSaveChanges: function () {
        var that = this;
        let oModel = this.getView().getModel();
        if (!oModel.hasPendingChanges("UserChanges")) {
          MessageToast.show("No changes detected.");
          return;
        }

        this.getModel()
          .submitBatch("UserChanges")
          .then(() => {
            // Retrieve all messages from the model
            const oContext = this.byId("idTableUsers").getBinding("items");
            const aMessages = this.getModel().getMessages(oContext);

            if (aMessages.length > 0) {
              let aErrorMessages = aMessages.filter(
                (msg) => msg.getType() === "Error"
              );
              let aWarningMessages = aMessages.filter(
                (msg) => msg.getType() === "Warning"
              );

              if (aErrorMessages.length > 0) {
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
              }
            } else {
              MessageToast.show("User details updated successfully.");
            }
          })
          .catch((oError) => {
            MessageBox.error("Batch request failed: " + oError.message);
          });
      },

      formatSelectedRoles: function (aRoles) {
        if (!aRoles) return [];
        return aRoles.map((role) => role.role.ID);
      },

      onOpenUserReports: async function (oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const oUserId = oContext.getProperty("ID");
        const oUserName = oContext.getProperty("username");

        if (!this._oUserReportsDialog) {
          this._oUserReportsDialog = sap.ui.xmlfragment(
            "entitec.pbi.embedding.fragments.UserReports",
            this
          );
          this.getView().addDependent(this._oUserReportsDialog);
        }

        const oUserReportsModel = new sap.ui.model.json.JSONModel({
          selectedUserId: oUserId,
          selectedUserName: oUserName,
        });

        // Fetch Reports and Filters
        const oReports = await this._getViewModelData("/ReportsExposed");
        const oFilters = await this._getViewModelData("/SecurityFilters");

        oUserReportsModel.setProperty("/ReportsExposed", oReports);
        oUserReportsModel.setProperty("/SecurityFilters", oFilters);

        // Load assigned UserReports for that user
        const oUserReportsData = await this._getViewModelData("/UserReports", {
          $expand: "report,securityFilters",
          $filter: `user_ID eq ${oUserId}`,
        });

        oUserReportsModel.setProperty("/UserReports", oUserReportsData);
        this._oUserReportsDialog.setModel(oUserReportsModel, "userReports");
        this._oUserReportsDialog.open();
      },

      _getViewModelData: async function (sPath, mParams = {}) {
        const oModel = this.getView().getModel(); // OData V4
        const oListBinding = oModel.bindList(
          sPath,
          undefined,
          undefined,
          undefined,
          mParams
        );
        const oContexts = await oListBinding.requestContexts();
        return oContexts.map((ctx) => ctx.getObject());
      },

      onAssignReportsToUser: function () {
        const oDialog = this._oUserReportsDialog;
        const oModel = this.getView().getModel(); // OData V4 model
        const oJSONModel = oDialog.getModel("userReports");

        const userId = oJSONModel.getProperty("/selectedUserId");
        const aReportIds = sap.ui
          .getCore()
          .byId("idSelectReports")
          .getSelectedKeys();
        const aFilterIds = sap.ui
          .getCore()
          .byId("idSelectSecurityFilters")
          .getSelectedKeys();

        if (!aReportIds.length) {
          MessageToast.show("Please select at least one report.");
          return;
        }

        const oBinding = oModel.bindList(
          "/UserReports",
          undefined,
          undefined,
          undefined,
          { $$updateGroupId: "UserChanges" }
        );

        aReportIds.forEach((reportId) => {
          oBinding.create({
            user_ID: userId,
            report_ID: reportId,
            securityFilters: aFilterIds.map((id) => ({ ID: id })),
          });
        });

        MessageToast.show("Reports assigned. Please save to apply changes.");
        oDialog.close();
      },

      onDeleteAssignedReport: function (oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
      
        if (!oContext) {
          MessageBox.error("Context not found for deletion.");
          return;
        }
      
        oContext.delete("UserChanges").then(() => {
          MessageToast.show("Report assignment deleted successfully. Save changes.");
        }).catch((oError) => {
          MessageBox.error("Deletion failed: " + oError.message);
        });
      },

      onCloseUserReportsDialog: function () {
        this._oUserReportsDialog.close();
      },
    });
  }
);
