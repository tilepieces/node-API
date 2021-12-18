const fs = require("fs");
const path = require("path");
const isDir = require("../utils/isDir");
module.exports = function (dir) {
  var dirs = [];
  var f = [];
  return new Promise((res, rej) => {
    fs.readdir(dir, async (err, files) => {
      if (err) return rej(err);
      for (var i = 0; i < files.length; i++) {
        var name = files[i];
        var file = dir + path.sep + name;
        var isdir;
        try {
          isdir = await isDir(file);
        } catch (e) {
          continue;
        }
        if (isdir)
          dirs.push(name);
        else
          f.push(name)
      }
      var objDir = {};
      dirs.sort((a, b) => a.localeCompare(b)).forEach(v => objDir[v] = {});
      f.sort((a, b) => a.localeCompare(b)).forEach(v => objDir[v] = v);
      res(objDir);
    });
  });
}