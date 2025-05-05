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





