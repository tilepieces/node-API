const fs = require("fs");
module.exports = function (basePath) {
  return new Promise((res, rej) => {
    fs.readFile(basePath + "settings.json", 'utf8', (err, data) => {
      if (err)
        rej(err);
      else
        res(JSON.parse(data))
    });
  })
}