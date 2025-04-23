sap.ui.define([], function () {
    "use strict";
  
    return {
        formatRoles: function (roles) {
            if (!roles || roles.length === 0) return "";
            return roles.map(r => r.name).join(", ");
          }
    };
  });
  