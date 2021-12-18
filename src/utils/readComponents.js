const fs = require("fs");
const path = require("path");
const fsPromises = require('fs').promises;
const readComponentsJSON = require(__dirname + "/readComponentsJSON");
module.exports = function (basePath) {
  return new Promise((res, rej) => {
    fs.readFile(basePath + "components.json", 'utf8', async (err, data) => {
      if (err)
        rej(err);
      else {
        var components, cRaw;
        try {
          cRaw = JSON.parse(data);
          components = await readComponentsJSON(cRaw, "", basePath);
        } catch (e) {
          console.log("[error in parsing components]", data);
          console.log(e);
          rej(e);
        }
        res(components)
      }
    });
  })
}