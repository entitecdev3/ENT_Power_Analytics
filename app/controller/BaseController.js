sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "entitec/pbi/embedding/dbapi/dbapi",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/Device",
    "entitec/pbi/embedding/model/formatter",
  ],
  function (
    Controller,
    MessageToast,
    History,
    dbapi,
    Fragment,
    MessageBox,
    Device,
    formatter
  ) {
    "use strict";

    return Controller.extend(
      "entitec.pbi.embedding.controller.BaseController",
      {
        formatter: formatter,
        middleWare: dbapi,
        /**
         * Retrieves the router instance for navigation
         * @returns {sap.ui.core.routing.Router} Router instance
         */

        getRouter: function () {
          return this.getOwnerComponent().getRouter();
        },

        /**
         * Navigates to a specific route
         * @param {string} sRoute Name of the route
         * @param {object} [oParams] Optional parameters for navigation
         */
        navigateTo: function (sRoute, oParams) {
          this.getRouter().navTo(sRoute, oParams || {});
        },

        /**
         * Displays a toast message
         * @param {string} sMessage The message to display
         */
        showToast: function (sMessage) {
          MessageToast.show(sMessage);
        },

        /**
         * Retrieves the model by name
         * @param {string} sName Name of the model
         * @returns {sap.ui.model.Model} The requested model
         */
        getModel: function (sName) {
          return this.getOwnerComponent().getModel(sName);
        },

        /**
         * Sets a model to the view
         * @param {sap.ui.model.Model} oModel Model instance
         * @param {string} sName Name of the model
         */
        setModel: function (oModel, sName) {
          this.getOwnerComponent().setModel(oModel, sName);
        },

        /**
         * Retrieves the resource bundle for i18n translations
         * @returns {sap.base.i18n.ResourceBundle} Resource bundle instance
         */
        getResourceBundle: function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Navigates back to the previous page if available, else navigates to the home page
         */
        onNavBack: function () {
          var oHistory = History.getInstance();
          var sPreviousHash = oHistory.getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.go(-1);
          } else {
            this.getRouter().navTo("Apps", {}, true);
          }
        },
        onLogOut: function (oEvent) {
          var that = this;
          this.middleWare
            .callMiddleWare("/logout", "POST")
            .then(function (oData) {
              window.location.href = "/";
              sessionStorage.removeItem("LoggedInUser");
              that.getRouter().navTo("Login");
            })
            .catch(function (oError) {
              sessionStorage.removeItem("LoggedInUser");
              that.getRouter().navTo("Login"); // Redirect to login on failure
              window.location.href = "/";
              var oViewModel = this.getView().getModel("appView");
              oViewModel.setProperty("/LoginHeader", true); // Show login header
              oViewModel.setProperty("/HomeScreen", false); // Hide home header
              oViewModel.setProperty("/navVisible", false); // Hide back button
              that.middleWare.errorHandler(oError, that);
            });
        },
        onUserInfo: function (oEvent) {
          var oButton = oEvent.getSource(),
            oView = this.getView();
          if (!this._pPopoverUser) {
            this._pPopoverUser = Fragment.load({
              id: oView.getId(),
              name: "entitec.pbi.embedding.fragments.UserInfo",
              controller: this,
            }).then(function (oPopover) {
              oView.addDependent(oPopover);
              return oPopover;
            });
          }
          this._pPopoverUser.then(function (oPopover) {
            oPopover.openBy(oButton);
          });
        },
        onProfilePress: async function (oEvent) {
          var oButton = oEvent.getSource();
          var oView = this.getView();

          // Check if local model already has user info
          if (!this._userInfoModel) {
            // Call the function import using bindContext (only once)
            const oBindingContext = oView
              .getModel()
              .bindContext("/getUserInfo()");
            try {
              const oUserData = await oBindingContext.requestObject();

              // Save result to a local JSONModel
              this._userInfoModel = new sap.ui.model.json.JSONModel(oUserData);
            } catch (err) {
              MessageToast.show("Failed to load user info");
              return;
            }
          }

          // Load fragment if not already loaded
          if (!this._pPopover) {
            this._pPopover = Fragment.load({
              name: "entitec.pbi.embedding.fragments.UserMenu",
              controller: this,
            }).then(
              function (oPopover) {
                oView.addDependent(oPopover);

                // Set model only once here
                oPopover.setModel(this._userInfoModel, "userInfo");
                return oPopover;
              }.bind(this)
            );
          }

          // Show the fragment
          this._pPopover.then(function (oPopover) {
            oPopover.openBy(oButton);
          });
        },

        onThemeChange: function (oEvent) {
          sap.ui.getCore().applyTheme("sap_horizon");
          sessionStorage.theme = "sap_horizon";
        },

        onThemeChangeDark: function (oEvent) {
          sap.ui.getCore().applyTheme("sap_horizon_dark");
          sessionStorage.theme = "sap_horizon_dark";
        },

        onSeePasswordClick: function (oEvent) {
          var oInput = oEvent.getSource();
          if (oInput.getType() === "Password") {
            setTimeout(function () {
              oInput.setType("Password");
              oInput.setValueHelpIconSrc("sap-icon://show");
            }, 2000);
            oInput.setType("Text");
            oInput.setValueHelpIconSrc("sap-icon://hide");
          } else {
            oInput.setType("Password");
            oInput.setValueHelpIconSrc("sap-icon://show");
          }
        },

        getRequiredFieldsFromMetadata: async function (entityName) {
          const oModel = this.getView().getModel();
          const sServiceUrl = oModel
            .getMetaModel()
            .getAbsoluteServiceUrl("$metadata");
          const sMetadataUrl = sServiceUrl + "/$metadata";
          const oMetadataXML = await fetch(sMetadataUrl).then((res) =>
            res.text()
          );

          const oParser = new DOMParser();
          const oXmlDoc = oParser.parseFromString(
            oMetadataXML,
            "application/xml"
          );

          const oEntityType = [
            ...oXmlDoc.getElementsByTagName("EntityType"),
          ].find((type) => type.getAttribute("Name") === entityName);

          const aRequiredFields = [];
          const aPrimaryKeys = [];

          if (oEntityType) {
            const oKey = oEntityType.getElementsByTagName("Key")[0];
            if (oKey) {
              const keyProps = oKey.getElementsByTagName("PropertyRef");
              for (let keyProp of keyProps) {
                aPrimaryKeys.push(keyProp.getAttribute("Name"));
              }
            }

            const properties = oEntityType.getElementsByTagName("Property");
            for (let prop of properties) {
              const propName = prop.getAttribute("Name");
              const isNullable = prop.getAttribute("Nullable");
              if (isNullable === "false" && !aPrimaryKeys.includes(propName)) {
                aRequiredFields.push(propName);
              }
            }
          }

          return aRequiredFields;
        },

        validateEntityFields: async function (
          entityName,
          dataObject,
          skipFields = []
        ) {
          const requiredFields = await this.getRequiredFieldsFromMetadata(
            entityName
          );

          for (let field of requiredFields) {
            if (skipFields.includes(field)) {
              continue;
            }

            if (!dataObject[field]) {
              MessageBox.error(`${field} is required.`);
              return false;
            }
          }
          return true;
        },

        onChangeHighlightTableRow: function (tableName) {
          let oTable = this.byId(tableName);
          let oItems = oTable?.getItems() || [];
          if (oItems && oItems.length > 0) {
            oItems.forEach((item) => {
              // Check if the item has pending changes or not
              let bChanges = item?.getBindingContext()?.hasPendingChanges();
              if (bChanges) {
                item?.setHighlight("Information");
              } else {
                item?.setHighlight("None");
              }
            });
          }
        },
        getCallData: async function (localModel, oModel, sPath, path) {
          let oBinding = oModel.bindList(sPath);
          let aContexts = await oBinding.requestContexts(0, 1000);
          let aData = aContexts?.map((oContext) => oContext?.getObject());
          localModel.setProperty(path, aData || []);
        },
        visSaveDiscardButton: function (groupId) {
          let oModel = this.getView().getModel(),
            oViewModel = this.getView().getModel("appView"),
            bPendingChanges = oModel.hasPendingChanges(groupId);
          oViewModel.setProperty("/visSaveButton", bPendingChanges);
          oViewModel.setProperty("/visDiscardButton", bPendingChanges);
        },
      }
    );
  }
);
