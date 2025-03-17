sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "entitec/pbi/embedding/dbapi/dbapi",
    "sap/ui/core/Fragment"
], function (Controller, MessageToast, History, dbapi, Fragment) {
    "use strict";

    return Controller.extend("entitec.pbi.embedding.controller.BaseController", {

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
            return this.getView().getModel(sName);
        },

        /**
         * Sets a model to the view
         * @param {sap.ui.model.Model} oModel Model instance
         * @param {string} sName Name of the model
         */
        setModel: function (oModel, sName) {
            this.getView().setModel(oModel, sName);
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

        verifySession: async function () {
            var that = this;
            this.middleWare
                .callMiddleWare(`/VerifySession`, "GET")
                .then(function (data, status, xhr) {
                    that.getRouter().navTo("ReportConfiguration"); // Navigate if session is valid
                })
                .catch(function (jqXhr, textStatus, errorMessage) {
                    sessionStorage.session_id = null;

                    that.getRouter().navTo("Login"); // Redirect to login on failure
                    that.middleWare.errorHandler(jqXhr, that);
                });
        },
        onLogOut: function (oEvent) {
            var that = this, UI_SOURCE;
            UI_SOURCE = oEvent.getSource();
            this.middleWare.callMiddleWare("/USER-LOGOUT?UI_SOURCE=" + UI_SOURCE, "GET").then(function (oData) {
                that.getRouter().navTo("Login"); // Navigate if session is valid
            }).catch(function (oError) {
                that.getRouter().navTo("Login"); // Redirect to login on failure
                that.middleWare.errorHandler(oError, that);
            });
        },

        onUserInfo: function (oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();
            if (!this._pPopoverUser) {
                this._pPopoverUser = Fragment.load({
                    id: oView.getId(),
                    name: "nvid.sample.fragments.UserInfo",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopoverUser.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },

        onProfilePress: function (oEvent) {

            var oButton = oEvent.getSource(),
                oView = this.getView();

            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    name: "entitec.pbi.embedding.fragments.UserMenu",
                    controller: this,
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }

            this._pPopover.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },
        // onNavBack: function () {
        //     var oHistory = History.getInstance();
        //     var sPreviousHash = oHistory.getPreviousHash();

        //     if (sPreviousHash !== undefined) {
        //         window.history.go(-1);
        //     }
        // },
        getCustomData: function () {
            var that = this;
            this.middleWare.callMiddleWare("/CustomAttribute", "GET")
                .then(function (data) {
                    that.getModel("appView").setProperty("/headerVisible", true);
                    that.getModel("appView").setProperty("/customData", data);
                    that.getModel("appView").setProperty("/loginUser", data.Email);
                    that.getModel("appView").setProperty("/loginUserCode", data.Code);
                    if (data.environment && data.environment.toLowerCase().trim() != 'prod') {
                        that.getView().getModel('configFile').setProperty("/environment", data.environment);
                    }
                    if (data.language) {
                        if (data.language.includes('en')) {
                            sap.ui.getCore().getConfiguration().setLanguage('en');
                        }
                        else {
                            sap.ui.getCore().getConfiguration().setLanguage('it');
                        }
                    }
                }).catch(function (oError) {
                    that.middleWare.errorHandler(oError, that);
                });
        },
        onSeePasswordClick: function (oEvent) {
            var oInput = oEvent.getSource();
            if (oInput.getType() === "Password") {
                setTimeout(function () {
                    oInput.setType("Password");
                    oInput.setValueHelpIconSrc("sap-icon://show");
                }, 2000)
                oInput.setType("Text");
                oInput.setValueHelpIconSrc("sap-icon://hide");
            }
            else {
                oInput.setType("Password");
                oInput.setValueHelpIconSrc("sap-icon://show");
            }
        },
    });
});
