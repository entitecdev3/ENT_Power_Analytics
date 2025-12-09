const cds = require("@sap/cds");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cov2ap = require("@cap-js-community/odata-v2-adapter");

// Determine config.json path
const configDev = path.join(process.cwd(), "app/webapp/config.json");
const configProd = path.join(process.cwd(), "app-dist/config.json");

// Load config.json (dev OR build)
const config = fs.existsSync(configProd)
  ? JSON.parse(fs.readFileSync(configProd))
  : JSON.parse(fs.readFileSync(configDev));

const PORT = config.port;
const PROTOCOL = config.protocol;
const HOST = config.host;

// Force CAP server to use the configured port
process.env.PORT = PORT;

cds.on("bootstrap", (app) => {
  app.use(cov2ap());

  const isProd = fs.existsSync(configProd);
  const uiRoot = isProd
    ? path.join(process.cwd(), "app-dist")
    : path.join(process.cwd(), "app/webapp");

  console.log("Serving UI from:", uiRoot);

  app.use(express.static(uiRoot));

  app.get("/", (req, res) => {
    res.sendFile(path.join(uiRoot, "index.html"));
  });

  // UI5 router fallback
  app.get("/*", (req, res, next) => {
    const url = req.path;
    if (url.startsWith("/odata") ||
      url.startsWith("/powerbi") ||
      url.startsWith("/auth") ||
      url.startsWith("/$batch")) return next();
    res.sendFile(path.join(uiRoot, "index.html"));
  });
});

module.exports = cds.server;
