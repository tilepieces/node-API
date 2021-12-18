const writeResponse = require("../utils/writeResponse");
const readSettings = require("../utils/readSettings");
const readProjects = require("../utils/readProjects");
const readComponents = require("../utils/readComponents.js");
const updateProjects = require("../utils/updateProjects");
const fsPromises = require('fs').promises;
const fs = require("fs");
const path = require("path");
const moveToProject = require("../utils/moveToProject");
module.exports = async function (req, res, $self) {
  var currentProject = req.headers['current-project'];
  if (currentProject && currentProject != $self.projectName) {
    try {
      await moveToProject(currentProject, $self)
    } catch (e) {
      return writeResponse(res, {result: 0, error: e}, $self.headers);
    }
  }
  console.log("[SETTINGS POST] ", req.method, req.url, currentProject);
  try {
    var body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', async () => {
      body = Buffer.concat(body).toString();
      try {
        var newSettings = JSON.parse(body);
        var oldSettings = await readSettings($self.basePath);
        var projects = await readProjects($self.basePath);
      } catch (e) {
        return writeResponse(res,
          {result: 0, err: e.toString()}, $self.headers);
      }
      var project = projects.find(v => v.name == $self.projectName);
      var componentFile;
      try {
        componentFile = await fsPromises.readFile($self.basePath + "components.json", 'utf8')
      } catch (e) {
        componentFile = "{}"
      }
      var components = JSON.parse(componentFile);
      if (newSettings.projectSettings) {
        project = Object.assign(project, newSettings.projectSettings);
        var cloneProjectToSave = Object.assign({}, project);
        delete cloneProjectToSave.path;
        await fsPromises.writeFile(path.normalize((project.path || $self.basePath) + "/tilepieces.project.json"),
          JSON.stringify(cloneProjectToSave, null, 2), 'utf8');
      }
      // this keys must not be updated
      if (newSettings.settings) {
        delete newSettings.settings.workspace;
        delete newSettings.settings.components;
        delete newSettings.settings.trash;
        delete newSettings.settings.applicationName;
        delete newSettings.settings.controllersInterface;
        var settings = Object.assign(oldSettings, newSettings.settings);
        //console.log(settings,oldSettings,newSettings)
        await new Promise((res, rej) => {
          fs.writeFile($self.basePath + "settings.json",
            JSON.stringify(settings, null, 2), 'utf8', err => {
              if (err)
                rej(err);
              else
                res();
            })
        });
      }
      writeResponse(res, {result: 1}, $self.headers);
    });
  } catch (e) {
    return writeResponse(res,
      {result: 0, err: e.toString()}, $self.headers);
  }
};