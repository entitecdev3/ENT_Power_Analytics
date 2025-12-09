const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let config;
const configProd = path.join(__dirname, "app-dist/config.json");
const configDev = path.join(__dirname, "app/webapp/config.json");

config = fs.existsSync(configProd)
  ? JSON.parse(fs.readFileSync(configProd))
  : JSON.parse(fs.readFileSync(configDev));

const serverUrl = `${config.protocol}://${config.host}:${config.port}`;

let server;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  win.loadURL(serverUrl);
}

app.on("ready", () => {
  server = spawn("node", ["srv/server.js"], {
    cwd: __dirname,
    shell: true
  });

  createWindow();
});

app.on("quit", () => {
  if (server) server.kill();
});
