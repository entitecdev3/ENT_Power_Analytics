sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "entitec/pbi/embedding/dbapi/dbapi",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/Device",
    "entitec/pbi/embedding/model/formatter"
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
        _userInfoModel: null,
        setUserInfo: async function () {
          const oView = this.getView();
          try {
            const oBindingContext = this.getModel().bindContext("/getUserInfo(...)");
            await oBindingContext.execute();
            const oContext = await oBindingContext.getBoundContext();
            const oUserData = oContext.getObject();

            this._userInfoModel = new sap.ui.model.json.JSONModel(oUserData);
            this.setModel(this._userInfoModel, "userInfo");
            this.getModel("userInfo").updateBindings();
          }
          catch (err) {
            console.error("Failed to load user info");
            return;
          }
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

        changeAppLanguage: function(sLanguage) {
          sap.ui.getCore().getConfiguration().setLanguage(sLanguage);
          const oOwnerComponent = this.getOwnerComponent();
          const oI18nSettings = oOwnerComponent.getManifestEntry("/sap.ui5/models/i18n/settings");
          const oNewI18nModel = new sap.ui.model.resource.ResourceModel(oI18nSettings);
          oOwnerComponent.setModel(oNewI18nModel, "i18n");
        },
        onLanguageChange: function (oEvent) {
          var oLangugae = oEvent.getSource()?.getKey?.() || oEvent.getSource()?.getSelectedKey?.();
          // sap.ui.getCore().getConfiguration().setLanguage(oLangugae);
          this.changeAppLanguage(oLangugae);
          this.getModel('appView').setProperty('/selectLang', oLangugae)
          this.updateToolbarTitle();
        },
        onNavBack: async function () {
          const oHistory = History.getInstance();
          const sPreviousHash = oHistory.getPreviousHash();
          const refererPort = this.getModel("config").getProperty("/refererPort");
          const host = window.location.hostname;
          const protocol = window.location.protocol;
          const oView = this.getView();
          const userInfo = this.getModel('userInfo')?.getData();
          const source = userInfo?.referer;
          const redirectUrl = `${source}#/Apps`;
          if (!sPreviousHash) {
            this.getRouter().navTo("Apps")
          } else {
            window.history.go(-1);
          }
        },
        onLogOut: async function () {
          try {
            const oView = this.getView();
            let oUserInfo = this.getOwnerComponent().getModel("userInfo"),
            userInfo = oUserInfo?.getData();
            const source = userInfo?.referer;
            oUserInfo.destroy();
            await this.middleWare.callMiddleWare("/logout", "POST");
            sessionStorage.clear();
            document.activeElement.blur();
            if (source) {
              window.location.href = source;
            } else {
              this.getRouter().navTo("Login")
            }
          } catch (err) {
            console.error("Logout failed", err);
            document.activeElement.blur();
            window.location.href = '/';
          }
        },
        updateToolbarTitle: function () {
          let sCurrentRoute = this.getRouter().getHashChanger().getHash().split('?')[0];
          let sTitle;
          let aRouteParts = sCurrentRoute.split('/');
          let sRelevantPart = aRouteParts[0];
          if (sCurrentRoute === 'Report') {
            sTitle = this.getModel("i18n").getProperty("REPORT");
          } else if (sCurrentRoute.includes('Configuration')) {
            sTitle = this.getModel("i18n").getProperty("Configuration");
          } else if (sCurrentRoute.includes('Administration')) {
            sTitle = this.getModel("i18n").getProperty("Administration");
          } 
          // if(!sCurrentRoute){
          //   sTitle = this.getModel('i18n').getProperty("")
          // }
          this.getModel("appView").setProperty("/subHeaderTitle", sTitle);
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
          let oButton = oEvent.getSource();
          let oView = this.getView();
          if ( ! this.getOwnerComponent().getModel("userInfo")?.getProperty("/username")) {
            await this.setUserInfo();
          } 

          if (!this._pPopover) {
            this._pPopover = Fragment.load({
              name: "entitec.pbi.embedding.fragments.UserMenu",
              controller: this,
            }).then(
              function (oPopover) {
                oView.addDependent(oPopover);
                return oPopover;
              }.bind(this)
            );
          }
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
