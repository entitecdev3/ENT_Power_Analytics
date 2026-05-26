const cds     = require("@sap/cds");
const express  = require("express");
const path     = require("path");
const fs       = require("fs");
const http     = require("http");
const https    = require("https");
const cov2ap   = require("@cap-js-community/odata-v2-adapter");

// ─── Load Config ────────────────────────────────────────────────────────────
const configDev  = path.join(process.cwd(), "app/webapp/config.json");
const configProd = path.join(process.cwd(), "app-dist/config.json");

const config = fs.existsSync(configProd)
  ? JSON.parse(fs.readFileSync(configProd))
  : JSON.parse(fs.readFileSync(configDev));

const PORT     = config.port || 4004;
const PROTOCOL = config.protocol;
const HOST     = config.host;

process.env.PORT = PORT;
if (PROTOCOL === "https") {
  const sslKeyPath  = path.resolve(process.cwd(), process.env.SSL_KEY_PATH);
  const sslCertPath = path.resolve(process.cwd(), process.env.SSL_CERT_PATH);
  const sslPassPhrase = process.env.SSL_PASS_PHRASE;

  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    console.log("❌ SSL files not found");
    process.exit(1);
  }

  let sslOptions = {
    key  : fs.readFileSync(sslKeyPath),
    cert : fs.readFileSync(sslCertPath),
  }
  if(sslPassPhrase){
    sslOptions['passphrase'] = sslPassPhrase;
  }
  const _originalCreateServer = http.createServer.bind(http)
  http.createServer = function (...args) {
    if (args.length === 1 && typeof args[0] === "function") {
      console.log("🔒 Intercepted http.createServer → upgrading to HTTPS")
      return https.createServer(sslOptions, args[0])
    }
    return _originalCreateServer(...args)
  }
} else {
  console.log("🔓 HTTP mode enabled")
}

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
    if (
      url.startsWith("/odata")   ||
      url.startsWith("/powerbi") ||
      url.startsWith("/auth")    ||
      url.startsWith("/api")     ||
      url.startsWith("/$batch")
    ) return next();
    res.sendFile(path.join(uiRoot, "index.html"));
  });
});

module.exports = cds.server;
