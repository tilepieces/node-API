const fs = require("fs");
const path = require("path");
const Busboy = require('busboy');
const writeResponse = require("../utils/writeResponse");
const createDir = require("../utils/createDir");
const isDir = require("../utils/isDir");
const moveToProject = require("../utils/moveToProject");
module.exports = async function (req, res, $self) {
  var currentProject = req.headers['current-project'];
  if (currentProject && currentProject != $self.projectName) {
    try {
      await moveToProject(currentProject, $self)
    } catch (e) {
      return writeResponse(res, {result: 0, error: e.toString()}, $self.headers);
    }
  }
  var {method, url} = req;
  var rootPath = $self.serverPath;
  console.log("[UPDATE] ", method, url, currentProject);
  var busboy = new Busboy({headers: req.headers});
  var updateFile = {
    fileArray: null,
    path: "",
    filename: ""
  };
  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    var buf = [];
    file.on('data', function (data) {
      buf.push(data);
    });
    file.on('end', function () {
      updateFile.fileArray = Buffer.concat(buf);
      updateFile.filename = filename || fieldname;
    });
  });
  busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    if (fieldname == "path")
      updateFile.path = val
  });
  busboy.on('finish', async () => {
    if (!updateFile.path)
      return writeResponse(res,
        {result: 0, path: updateFile.path, error: "no path"}, $self.headers);
    var finalPath = path.join($self.serverPath, updateFile.path);
    var parent = path.dirname(finalPath);
    try {
      var actualParent = await isDir(parent);
    } catch (e1) {
      try {
        await createDir(parent)
      } catch (e) {
        return writeResponse(res,
          {result: 0, path: updateFile.path, error: e.toString()}, $self.headers);
      }
    }
    if (updateFile.fileArray) {
      var ext = path.extname(finalPath);
      var type = "binary";
      if (($self.mimeTypes[ext] && ($self.mimeTypes[ext].startsWith("text/") ||
        $self.mimeTypes[ext] == "application/json" ||
        $self.mimeTypes[ext].indexOf("+xml") > -1)) || ext == "")
        type = "utf8";
      fs.writeFile(finalPath, updateFile.fileArray, type, e => {
        if (e)
          writeResponse(res,
            {result: 0, path: updateFile.path, error: e.toString()}, $self.headers);
        else
          writeResponse(res, {result: 1, path: updateFile.path}, $self.headers);
      });
    } else {
      createDir(finalPath)
        .then(cd => writeResponse(res, {result: 1, path: updateFile.path},
          Object.assign({}, $self.headers, {"tilepieces-directory": true})))
        .catch(e => writeResponse(res,
          {result: 0, path: updateFile.path, error: e.toString()}, $self.headers))
    }
  });
  req.pipe(busboy);
};