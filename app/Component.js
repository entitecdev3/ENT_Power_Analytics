sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "entitec/pbi/embedding/model/models",
  ],
  (UIComponent, MessageBox, Filter, FilterOperator, models) => {
    "use strict";

    return UIComponent.extend("entitec.pbi.embedding.Component", {
      metadata: {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
      },
      init() {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        // enable routing
        this.getRouter().initialize();

        // error handling
        const oMessageManager = sap.ui.getCore().getMessageManager(),
          oMessageModel = oMessageManager.getMessageModel(),
          oMessageModelBinding = oMessageModel.bindList(
            "/",
            undefined,
            [],
            new Filter("technical", FilterOperator.EQ, true)
          );

        oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
      },

      onMessageBindingChange: function (oEvent) {
        const aContexts = oEvent.getSource().getContexts();
        if (!aContexts.length) {
          return;
        }
      
        const aMessages = aContexts.map((oContext) => oContext.getObject());
      
        sap.ui.getCore().getMessageManager().removeMessages(aMessages);
      
        const bUnauthorized = aMessages.some(
          (msg) =>
            msg.technicalDetails?.httpStatus === 401 ||
            (msg.message && msg.message.includes("Unauthorized"))
        );
      
        if (bUnauthorized) {
          MessageBox.error("Your session has expired. Please login again.", {
            onClose: function () {
              sap.ui.getCore().getMessageManager().removeAllMessages();
              this.bError = false;
                window.location.href = '/';
            }.bind(this),
          });
          return;
        }
      
        const sMessageText = aMessages
          .map((msg) => {
            const mainMessage =
              msg.message ||
              msg.technicalDetails?.originalMessage ||
              "Unknown error";
            const httpStatus = msg.technicalDetails?.httpStatus
              ? `\nStatus: ${msg.technicalDetails.httpStatus}`
              : "";
            return `${mainMessage}${httpStatus}`;
          })
          .join("\n");
      
        MessageBox.error(sMessageText, {
          onClose: function () {
            sap.ui.getCore().getMessageManager().removeAllMessages();
            this.bError = false;
          }.bind(this),
        });
      },
    });
  }
);
