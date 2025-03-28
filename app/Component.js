sap.ui.define([
    "sap/ui/core/UIComponent",
    "entitec/pbi/embedding/model/models"
], (UIComponent, models) => {
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
            // this.setModel(models.createAppModel(), "appView");

            // enable routing
            this.getRouter().initialize();
        }
    });
});