sap.ui.define([
    "sap/ui/core/UIComponent",
    "entitec/pbi/embedding/model/models",
    // "powerbi-client"
], (UIComponent, models, ErrorHandler) => {
    "use strict";

    return UIComponent.extend("entitec.pbi.embedding.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },
        init() {

            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");


            // enable routing
            this.getRouter().initialize();

        },


        destroy: function () {
            this._oErrorHandler.destroy();
            UIComponent.prototype.destroy.apply(this, arguments);
        }
    });
});