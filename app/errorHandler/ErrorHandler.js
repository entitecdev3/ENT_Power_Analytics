// sap.ui.define([
// 	"sap/ui/base/Object",
// 	"sap/m/MessageBox",
// ], function (UI5Object, MessageBox) {
// 	"use strict";

// 	return UI5Object.extend("entitec.pbi.embedding.controller.controls.ErrorHandler", {

// 		/**
// 		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
// 		 * @class
// 		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
// 		 * @public
// 		 * @alias entitec.pbi.embedding.controller.controls.ErrorHandler
// 		 */
// 		constructor : function (oComponent) {
// 			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
// 			this._oComponent = oComponent;
// 			this._oModel = oComponent.getModel();
// 			this._bMessageOpen = false;
// 			this._sErrorText = this._oResourceBundle.getText("errorText");
// 			this.sessionExp=this._oResourceBundle.getText("SessionExpire");

// 			// s

// 			this._oModel.attachRequestFailed(function (oEvent) {
// 				var oParams = oEvent.getParameters();
// 				// An entity that was not found in the service is also throwing a 404 error in oData.
// 				// We already cover this case with a notFound target so we skip it here.
// 				// A request that cannot be sent to the server is a technical error that we have to handle though
// 				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
// 					this._showServiceError(oParams.response);
// 				}
// 			}, this);
// 		},

// 		/**
// 		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
// 		 * Only the first error message will be display.
// 		 * @param {string} sDetails a technical error to be displayed on request
// 		 * @private
// 		 */
// 		_showServiceError : function (sDetails) {
// 			if (this._bMessageOpen) {
// 				return;
// 			}
// 			this._bMessageOpen = true;
			 
// 			// var that=this;
// 			if(sDetails.statusText=='Unauthorized'){
// 				// var oMessage=this.getModel("i18n").getProperty("SessionExpire");
// 				sessionStorage.session_id=null;
// 				MessageBox.error(this.sessionExp,{
// 					actions:[MessageBox.Action.OK],
// 					onClose:function(){
						 
// 						window.location.href="/";
// 					}
// 				}
// 				);
// 			}
// 			else{
// 			MessageBox.error(
// 				this._sErrorText,
// 				{
// 					id : "serviceErrorMessageBox",
// 					details : sDetails,
// 					styleClass : this._oComponent.getContentDensityClass(),
// 					actions : [MessageBox.Action.CLOSE],
// 					onClose : function () {
// 						this._bMessageOpen = false;
// 					}.bind(this)
// 				}
// 			);
// 		}
// 		}

// 	});

// });
sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/message/MessageManager",
    "sap/ui/core/message/Message"
], function (UI5Object, MessageBox, MessageToast, MessageManager, Message) {
    "use strict";

    return UI5Object.extend("entitec.pbi.embedding.errorHandler.ErrorHandler", {
        /**
         * Constructor for the ErrorHandler.
         * @param {sap.ui.core.UIComponent} oComponent - The UI5 component instance.
         */
		constructor: function (oComponent) {
            this._oComponent = oComponent;
            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this._oComponent.getRootControl(), true);
            this._bMessageOpen = false;

            // Attach a message change event listener
            this._oMessageManager.getMessageModel().attachPropertyChange(this._onMessageChange, this);
        },

        /**
         * Event handler for message changes.
         * @param {sap.ui.base.Event} oEvent - The event object.
         * @private
         */
        _onMessageChange: function (oEvent) {
            var aMessages = this._oMessageManager.getMessageModel().getData();
            var aErrorMessages = aMessages.filter(function (oMessage) {
                return oMessage.type === sap.ui.core.MessageType.Error;
            });

            if (aErrorMessages.length && !this._bMessageOpen) {
                this._bMessageOpen = true;
                MessageBox.error(aErrorMessages.map(function (oMessage) {
                    return oMessage.message;
                }).join("\n"), {
                    onClose: function () {
                        this._bMessageOpen = false;
                    }.bind(this)
                });
            }
        },

        /**
         * Displays a success message in a MessageToast.
         * @param {string} sMessage - The success message to display.
         */
        showSuccessMessage: function (sMessage) {
            MessageToast.show(sMessage);
        }
    });
});





