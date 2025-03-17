sap.ui.define(
    [
      "jquery.sap.global",
      "sap/m/MessageBox"
    ],
    function (jQuery, MessageBox) {
      "use strict";
  
      return {
        callMiddleWare: function (sUrl, sMethod, oPayload, asyncBol) {
          return new Promise(function (resolve, reject) {
            asyncBol = asyncBol ? asyncBol : true;
            var currentDate = new Date();
            if (!(sUrl && sMethod)) {
              reject("Invalid parameters passed");
            }
            switch (sMethod.toUpperCase()) {
              case "GET":
                $.ajax("/api" + sUrl, {
                  async: asyncBol,
                  type: "GET", // http method
                  contentType: "application/json",
                  success: function (data, status, xhr) {
                    resolve(data);
                  },
                  error: function (jqXhr, textStatus, errorMessage) {
                    reject(jqXhr.responseText || errorMessage);
                  },
                });
                break;
              case "POST":
                $.ajax("/api" + sUrl, {
                  type: "POST", // http method
                  contentType: "application/json",
                  data: JSON.stringify(oPayload), // data to submit
                  success: function (data, status, xhr) {
                    resolve(data);
                  },
                  error: function (jqXhr, textStatus, errorMessage) {
                    reject(jqXhr.responseText || errorMessage);
                  },
                });
                break;
              case "POST_A":
                $.ajax("/api" + sUrl, {
                  type: "POST", // http method
                  contentType: "multipart/form-data; boundary=AttachmentBoundary",
                  data: oPayload, // data to submit
                  success: function (data, status, xhr) {
                    resolve(data);
                  },
                  error: function (jqXhr, textStatus, errorMessage) {
                    reject(jqXhr.responseText || errorMessage);
                  },
                });
                break;
              case "PUT":
                $.ajax("/api" + sUrl, {
                  type: "PUT", // http method
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  contentType: "application/json",
                  data: JSON.stringify(oPayload), // data to submit
                  success: function (data, status, xhr) {
                    resolve(data);
                  },
                  error: function (jqXhr, textStatus, errorMessage) {
                    reject(jqXhr.responseText || errorMessage);
                  },
                });
                break;
              case "PATCH":
                $.ajax("/api" + sUrl, {
                  type: "PATCH", // http method
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  contentType: "application/json",
                  data: JSON.stringify(oPayload), // data to submit
                  success: function (data, status, xhr) {
                    resolve(data);
                  },
                  error: function (jqXhr, textStatus, errorMessage) {
                    reject(jqXhr.responseText || errorMessage);
                  },
                });
  
                break;
              case "DELETE":
                $.ajax("/api" + sUrl, {
                  type: "DELETE", // http method
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  success: function (data, status, xhr) {
                    resolve(data);
                  },
                  error: function (jqXhr, textStatus, errorMessage) {
                    reject(jqXhr.responseText || errorMessage);
                  },
                });
  
                break;
              default:
                jQuery.sap.log.error("No case matched");
                break;
            }
          });
        },
        errorHandler: function (jqr, then) {
          then.getView().setBusy(false);
          var type = typeof jqr;
          switch (type) {
            case "string":
              try {
                if (jqr.includes("error - No Task Found To Create Order.")) {
                  MessageBox.information("No Task Found To Create Order.");
                  then.getView().setBusy(false);
                  return;
                }
                if (jqr && (jqr.includes('No matching records found') || jqr.includes('Nessun record dati coincidente trovato (ODBC -2028)'))) {
                  MessageBox.error(then.getModel("i18n").getProperty("noRecordsFound"));
                  return;
                }
                if (jqr.includes("No draft record found!")) {
                  MessageBox.error(then
                    .getModel("i18n")
                    .getProperty("NoDraftFound"));
                  return;
                }
                if (jqr.includes("ERROR - NO LICENSE assigned to the User. Please contact Administrator")) {
                  MessageBox.error(then
                    .getModel("i18n")
                    .getProperty("NoLicenseFound"));
                  return;
                }
                if (jqr.includes("no data in selected date range")) {
                  MessageBox.error(then
                    .getModel("i18n")
                    .getProperty("NoDataInRange"));
                  return;
                }
                if (JSON.parse(jqr).text) {
                  var text = JSON.parse(JSON.parse(jqr).text).error.message;
                } else if (JSON.parse(jqr).ProductionOrderPostErr) {
                  var text =
                    JSON.parse(jqr).ProductionOrderPostErr[0][0].error.message;
                } else if (JSON.parse(jqr).error) {
                  if (
                    jqr.includes("Session expired.") ||
                    jqr.includes("authenticated")
                  ) {
                    sessionStorage.session_id = null;
                    var oMessage = then.getModel("i18n").getProperty("SessionExpire");
                    MessageBox.error(oMessage, {
                      actions: [MessageBox.Action.OK],
                      onClose: function () {
                        window.location.href = "/";
                      },
                    });
                  }
                  var text = JSON.parse(jqr).error;
                } else if (
                  JSON.parse(jqr).response.text &&
                  JSON.parse(JSON.parse(jqr).response.text).error.message
                ) {
                  var text = JSON.parse(JSON.parse(jqr).response.text).error.message;
                } else {
                  var text = "An error occured";
                }
  
                if (text.value) {
                  text.value = text.value.replace(
                    /"password":\s*"(.*)"/gim,
                    "password:*****"
                  );
                  MessageBox.error(text.value);
                } else {
                  text = text.replace(
                    /"password":\s*"(.*)"/gim,
                    "password:*****"
                  );
                  MessageBox.error(text);
                }
              } catch (error) {
                if (
                  jqr.includes("Session expired.") ||
                  jqr.includes("authenticated")
                ) {
                  sessionStorage.session_id = null;
                  var oMessage = then
                    .getModel("i18n")
                    .getProperty("SessionExpire");
                  MessageBox.error(oMessage, {
                    actions: [MessageBox.Action.OK],
                    onClose: function () {
                      window.location.href = "/";
                    },
                  });
                } else if (jqr.includes("User Not Found")) {
                  var oEmail = jqr.split(":")[1];
                  var oMessage = then
                    .getModel("i18n")
                    .getProperty("notFoundUser");
                  oMessage = oMessage.replace("<login-email>", oEmail);
                  MessageBox.error(oMessage);
                } else if (jqr.includes("no such file or directory")) {
                  var oMessage = then.getModel("i18n").getProperty("noFileFound");
                  var oName = jqr
                    .split("\\")
                  [jqr.split("\\").length - 1].split("'")[0];
                  oMessage = oMessage.replace("<fileName>", oName);
                  MessageBox.error(oMessage);
                } else {
                  jqr = jqr.replace(/"password":\s*"(.*)"/gim, "password:*****");
                  MessageBox.error(jqr);
                }
              }
  
              break;
            case "object":
              if (jqr.responseText) {
                MessageBox.error(jqr.responseText);
                break;
              }
              let oString = jqr.toString();
              oString = oString.replace(
                /"password":\s*"(.*)"/gim,
                "password:*****"
              );
              MessageBox.error(oString);
              break;
            default:
              let oStrings = jqr.toString();
              oStrings = oStrings.replace(
                /"password":\s*"(.*)"/gim,
                "password:*****"
              );
              MessageBox.error(oStrings);
              break;
          }
        },
        onTimeZone: function (d) {
          if (d.getTimezoneOffset() > 0) {
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
          } else {
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          }
          return d;
        },
        oDataV2Date: function (jsonDate) {
          var offset = new Date().getTimezoneOffset();
          var parts = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate);
          if (parts[1]) {
            if (parts[1].length > 1) {
              var oDate = new Date(+parts[1]);
              return oDate;
            } else {
              return null;
            }
          }
        },
        batchPayloadGenerator: function (sUrl, sMethod, oPayload, oKey) {
          if (!oPayload) {
            return [];
          }
          if (oPayload.length === 0) {
            return [];
          }
          var aPayload = [];
          var oIndex = 0;
          var oResPay = {
            method: sMethod,
            atomicityGroup: "",
            url: sUrl,
            headers: {
              "content-type":
                "application/json; odata.metadata=minimal; odata.streaming=true",
              "odata-version": "4.0",
            },
            id: "",
            body: null,
          };
          for (let i = 0; i < oPayload.length; i++) {
            var oRes = JSON.parse(JSON.stringify(oResPay));
            if (sMethod !== "POST") {
              var oObj = oPayload[i];
              for (const key in oObj) {
                if (key == oKey) {
                  oRes.url = oRes.url + "(" + oObj[key] + ")";
                  break;
                }
              }
            }
            oIndex++;
            oRes.atomicityGroup = "g" + oIndex;
            oRes.id = "g" + oIndex + "-r1";
            oRes.body = oPayload[i];
            aPayload.push(oRes);
          }
          return aPayload;
        },
      };
    }
  );
  