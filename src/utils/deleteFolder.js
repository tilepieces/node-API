const fs = require("fs");
var deleteFolder = function (path) {
  fs.readdirSync(path).forEach(function (file) {
    var curPath = path + "/" + file;
    if (fs.lstatSync(curPath).isDirectory())
      deleteFolder(curPath);
    else {
      fs.unlinkSync(curPath);
    }
  });
  fs.rmdirSync(path);
};
module.exports = deleteFolder;