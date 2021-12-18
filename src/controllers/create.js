const fs = require("fs");
const path = require("path");
const readProjects = require("../utils/readProjects");
const writeResponse = require("../utils/writeResponse");
const updateProjects = require("../utils/updateProjects");
const deleteFolder = require("../utils/updateProjects");
var ncp = require('ncp').ncp;
ncp.limit = 16;
const readComponents = require("../utils/readComponents");
const readFile = require("../utils/readFile");
const readDir = require("../utils/readDir");
const isDir = require("../utils/isDir");
const createNewProject = require("../utils/createNewProject");
const fsPromises = require('fs').promises;
module.exports = async function (req, res, $self) {
  var {method, url} = req;
  console.log("[CREATE] ", method, url);
  var urlParams = new URLSearchParams(url);
  var name = urlParams.get('projectName');
  if (name) name = name.trim();
  if (!name || !name.length) {
    return writeResponse(res, {method, url, name, result: 0, err: "no project name"}, $self.headers);
  }
  try {
    var projects = await readProjects($self.basePath);
    var prEntry = projects.find(v => v.name == name);
    $self.serverPath = prEntry ?
      prEntry.path || $self.basePath :
      path.join($self.workspace, name);
    if (prEntry) {
      try {
        var checkDir = await isDir($self.serverPath);
        if (!checkDir) {
          throw "path associated with project is not a directory.";
        }
      } catch (e) {
        var errorDeleting = e;
        projects.splice(projects.findIndex(v => v.name == name), 1);
        try {
          await updateProjects(projects, $self.basePath)
        } catch (eup) {
          errorDeleting = "path associated with project is not a file. " +
            "Application tried to delete from project.json but an error has been raised:\n" + eup.toString();
        }
        return writeResponse(res, {result: 0, name, error: errorDeleting.toString()}, $self.headers);
      }
      $self.projectName = name;
      projects.splice(projects.findIndex(v => v.name == name), 1);
      projects.unshift(prEntry);
      await updateProjects(projects, $self.basePath)
    } else
      await createNewProject($self.serverPath, projects,
        name, $self.basePath);
    try {
      await readFile($self.serverPath + "/tilepieces.component.json");
      var componentFile;
      try {
        componentFile = await fsPromises.readFile($self.basePath + "components.json", 'utf8')
      } catch (e) {
        componentFile = "{}"
      }
      var components = JSON.parse(componentFile);
      if (!components[name]) {
        components[name] = {name, path: $self.serverPath};
        await fsPromises.writeFile($self.basePath + "/components.json",
          JSON.stringify(components, null, 2), 'utf8');
      }
    } catch (e) {
      console.error("[error on reading component from project create]");
      console.error(e);
    }
    var schema = await readDir($self.serverPath);
    $self.projectName = name;
    writeResponse(res, {name, schema, result: 1}, $self.headers);
  } catch (e) {
    return writeResponse(res, {result: 0, name, error: e.toString()}, $self.headers);
  }
};