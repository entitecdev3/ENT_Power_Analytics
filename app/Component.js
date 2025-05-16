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
        var bMessageOpen = false;
        if (!aContexts.length) {
          return;
        }
        this.bError = false;
        // Collect technical messages
        const aMessages = aContexts.map(function (oContext) {
          return oContext.getObject();
        });

        const bUnauthorized = aMessages.some(
          (msg) => msg.technicalDetails?.httpStatus === 401
        );

        sap.ui.getCore().getMessageManager().removeMessages(aMessages);

        if (aMessages.length) this.bError = true;

        // Build a full message text with technical details
        const sMessageText = aMessages
          .map((msg, idx) => {
            const mainMessage =
              msg.message ||
              msg.technicalDetails?.originalMessage ||
              "Unknown error";
            const httpStatus = msg.technicalDetails?.httpStatus
              ? `\nStatus: ${msg.technicalDetails.httpStatus}`
              : "";
            const originalMessage = msg.technicalDetails?.originalMessage
              ? `\n${msg.technicalDetails.originalMessage}`
              : "";
            // return `${idx + 1}. ${mainMessage}${httpStatus}${originalMessage}`;
            return `${mainMessage}${httpStatus}`;
          })
          .join("\n");

        MessageBox.error(sMessageText, {
          onClose: function () {
            bMessageOpen = false;
            sap.ui.getCore().getMessageManager().removeAllMessages();
            this.bError = false;
            if (bUnauthorized) {
              const oRouter = this.getRouter();
              oRouter.navTo("Login"); // Ensure route name matches your manifest
              window.location.href = "/";
            }
          }.bind(this),
        });
        bMessageOpen = true;
      },
    });
  }
);
