const server = require("@tilepieces-official/node-server");
const open = require('open');
const path = require('path');
const settingsPath = process.cwd() + path.sep + "./settings.json";
let settings = require(settingsPath);
settings.applicationName = "test";

function startServer() {
  var a = server(settings);
  a.then(res => {
    console.log("application name response", res.applicationName);
    open(res.home + "test/");
  }).catch(err => {
    if (err.code == "EADDRINUSE") {
      console.log("port " + settings.server.port + " already in use. Try next number...");
      settings.server.port += 1;
      startServer();
    }
  });
}

startServer();