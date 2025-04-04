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
            window.location.href = '/';
            var that = this;
            this.middleWare.callMiddleWare("/logout", "POST").then(function (oData) {
                that.getRouter().navTo("Login"); // Navigate if session is valid
            }).catch(function (oError) {
                that.getRouter().navTo("Login"); // Redirect to login on failure
                window.location.href = '/';
                var oViewModel = this.getView().getModel("appView");
                oViewModel.setProperty("/LoginHeader", true);   // Show login header
                oViewModel.setProperty("/HomeScreen", false);   // Hide home header
                oViewModel.setProperty("/navVisible", false);   // Hide back button
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
        }

        // attachODataEventHandlers: function () {
        //     var oDataModel = this.getOwnerComponent().getModel();
        
        //     if (!oDataModel) {
        //         console.error("ODataModel not found!");
        //         return;
        //     }
        
        //     // Function to attach event handlers to a binding
        //     var attachHandlers = (oBinding) => {
        //         if (!oBinding) return;
        
        //         oBinding.attachDataRequested(() => BusyIndicator.show(0));
        
        //         oBinding.attachDataReceived((oEvent) => {
        //             BusyIndicator.hide();
        
        //             var oError = oEvent.getParameter("error");
        //             if (oError) {
        //                 var statusCode = oError.status || oError.statusCode;
        //                 if (statusCode === 401 || statusCode === 403) {
        //                     MessageBox.error("Your session has expired. Please log in again.", {
        //                         onClose: function () {
        //                             var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        //                             oRouter.navTo("Login");
        //                         }.bind(this)
        //                     });
        //                 } else {
        //                     // ✅ Using this.middleWare.errorHandler 
        //                     this.middleWare.errorHandler(oError, this);
        //                 }
        //             }
        //         });
        //     };
        
        //     // // Attach to existing table/list bindings
        //     // var oTable = this.byId("yourTableId"); // Replace with actual table ID
        //     // if (oTable) {
        //     //     var oListBinding = oTable.getBinding("items");
        //     //     attachHandlers(oListBinding);
        //     // }
        
        //     // // Attach to form/context bindings
        //     // var oForm = this.byId("yourFormId"); // Replace with actual form ID
        //     // if (oForm) {
        //     //     var oContextBinding = oForm.getBinding("bindingContext");
        //     //     attachHandlers(oContextBinding);
        //     // }
        // }
        
        
        
    });
});
