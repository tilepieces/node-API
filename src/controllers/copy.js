const fs = require("fs");
const p = require("path");
const writeResponse = require("../utils/writeResponse");
const moveToProject = require("../utils/moveToProject");
var ncp = require('ncp').ncp;
ncp.limit = 16;
module.exports = async function (req, res, $self) {
  var {url} = req;
  var urlParams = new URLSearchParams(url);
  var path = urlParams.get('path');
  var newPath = urlParams.get('newPath');
  var move = urlParams.get('move');
  var currentProject = req.headers['current-project'];
  if (currentProject && currentProject != $self.projectName) {
    try {
      await moveToProject(currentProject, $self)
    } catch (e) {
      return writeResponse(res, {result: 0, error: e}, $self.headers);
    }
  }
  if (!newPath || !newPath.length)
    return writeResponse(res, {result: 0, error: "no new path", path}, $self.headers);
  console.log("[COPY]", url, path, currentProject);
  var filePath = p.join($self.serverPath || $self.basePath, path);
  fs.stat(filePath, (noExists, stat) => {
    if (noExists)
      return writeResponse(res, {result: 0, error: "path not found", filePath}, $self.headers);
    var newServerPath = p.join($self.serverPath || $self.basePath, newPath);
    //if(stat.isDirectory() && newServerPath.startsWith(filePath))
    //return writeResponse(res, {result: 0, error: "try to put a directory into itself", filePath,newPath}, $self.headers);
    if (move)
      fs.rename(filePath, newServerPath,
        (err) => {
          if (err)
            writeResponse(res, {result: 0, error: err.toString()}, $self.headers);
          else
            writeResponse(res, {result: 1}, $self.headers);
        });
    else {
      if (filePath == newServerPath) {
        // if file exists, rename it adding a number
        var pathParse = p.parse(newServerPath);
        // Returns:
        // { root: '/',
        //   dir: '/home/user/dir',
        //   base: 'file.txt',
        //   ext: '.txt',
        //   name: 'file' }
        var fileWithoutExt = pathParse.dir + p.sep + pathParse.base.replace(pathParse.ext, "");
        var number = fileWithoutExt.match(/\d+$/);
        var newNumber = number ? +number[0]++ : 0;
        newServerPath = fileWithoutExt + newNumber + pathParse.ext;
        while (fs.existsSync(newServerPath)) {
          newServerPath = fileWithoutExt + newNumber++ + pathParse.ext;
          console.log(fileWithoutExt, number, newServerPath);
        }

      }
      ncp(filePath, newServerPath, function (err) {
        if (err)
          writeResponse(res,
            {result: 0, error: err.toString()}, $self.headers);
        else
          writeResponse(res, {result: 1}, $self.headers);
      });
    }
  });
};