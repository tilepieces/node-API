const writeResponse = require("../utils/writeResponse");
const returnFolderFiles = require("../utils/returnFolderFiles");
const fsPromises = require('fs').promises;
const fs = require("fs");
const path = require("path");
const moveToProject = require("../utils/moveToProject");
module.exports = async function (req, res, $self) {
  var body = [];
  req.on('data', chunk => {
    body.push(chunk);
  }).on('end', async () => {
    var currentProject = req.headers['current-project'];
    console.log("[SEARCH] ", req.method, req.url, currentProject);
    body = Buffer.concat(body).toString();
    var s = JSON.parse(body);
    if (currentProject && !s.componentName && !s.projectName &&
      currentProject != $self.projectName) {
      try {
        await moveToProject(currentProject, $self)
      } catch (e) {
        return writeResponse(res, {result: 0, error: e}, $self.headers);
      }
    }
    var serverPath = $self.serverPath;
    if (s.componentName) {
      var components = JSON.parse(await fsPromises.readFile($self.basePath + "components.json", 'utf8'));
      var c = components[s.componentName];
      if (c)
        serverPath = c.path;
      else
        return writeResponse(res,
          {result: 0, error: "component not found", componentName: s.componentName}, $self.headers, 404);
    }
    if (s.projectName) {
      var projects = JSON.parse(await fsPromises.readFile($self.basePath + "projects.json", 'utf8'));
      var ppkg = projects.find(v => v.name == s.projectName);
      if (ppkg)
        serverPath = ppkg.path;
      else
        return writeResponse(res,
          {result: 0, error: "project not found", projectName: s.projectName}, $self.headers, 404);
    }
    var p = path.join(serverPath, s.dir);
    try {
      var searchResult = await returnFolderFiles(p, s.match, s.rgFile);
    } catch (e) {
      return writeResponse(res,
        {result: 0, err: e.toString()}, $self.headers);
    }
    writeResponse(res, {searchResult, result: 1}, $self.headers);
  });
};