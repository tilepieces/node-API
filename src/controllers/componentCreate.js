const fs = require("fs-extra");
const path = require("path");
const Busboy = require('busboy');
const readSettings = require("../utils/readSettings");
const readProjects = require("../utils/readProjects");
const readComponents = require("../utils/readComponents");
const updateProjects = require("../utils/updateProjects");
const getComponentsFlat = require("../utils/getComponentsFlat");
const readComponentsJSON = require("../utils/readComponentsJSON");
const fsPromises = require('fs').promises;
const writeResponse = require("../utils/writeResponse");
const createDir = require("../utils/createDir");
const isDir = require("../utils/isDir");
const moveToProject = require("../utils/moveToProject");
const componentDir = "components";
module.exports = async function (req, res, $self) {
  var currentProject = req.headers['current-project'];
  if (currentProject && currentProject != $self.projectName) {
    try {
      await moveToProject(currentProject, $self)
    } catch (e) {
      return writeResponse(res, {result: 0, error: e}, $self.headers);
    }
  }
  console.log("[COMPONENT CREATE] ", req.method, req.url, currentProject);
  var busboy = Busboy({headers: req.headers});
  var files = [];
  var newSettings;
  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    var buf = [];
    file.on('data', function (data) {
      buf.push(data);
    });
    file.on('end', function () {
      files.push({
        fileArray: Buffer.concat(buf),
        path: fieldname
      })
    });
  });
  busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    if (fieldname == "newSettings")
      newSettings = val
  });
  busboy.on('finish', async () => {
    try {
      newSettings = JSON.parse(newSettings);
      var projects = await readProjects($self.basePath);
      var project = projects.find(v => v.name == $self.projectName);
      var compPathInProj = $self.serverPath + "/" + (project?.componentPath || componentDir) + "/";
      var components = {};
      try {
        components = await readComponents($self.basePath);
      } catch (e) {
      }
      var component = newSettings.component;
      if (newSettings.local) {
        component.path = component.path || ("/" + (project.componentPath || componentDir) + "/" + component.name);
        compPathInProj = $self.serverPath + component.path + "/";
        !newSettings.copyInProject && await createDir(compPathInProj);
        // copy in project start
        if(newSettings.copyInProject){
          if(!project){
            return writeResponse(res,
              {result: 0, error: "create component copy in project called but no project setted"}, $self.headers);
          }
          var globalComponent = components && components[component.name];
          if(!globalComponent)
            return writeResponse(res,
              {result: 0, error: "create component copy in project called but no global component called " + component.name}, $self.headers);
          try {
            await fs.copy(globalComponent.path, compPathInProj)
          }
          catch(err){
              return writeResponse(res,
                {result: 0, error: err.toString()}, $self.headers);
          };
        }
        // copy in project end
        // update or create the JSON start
        var componentPathJSON = $self.serverPath + component.path + "/tilepieces.component.json";
        var currentJson;
        try {
          var currentJsonRaw = await fsPromises.readFile(componentPathJSON, 'utf8')
          currentJson = JSON.parse(currentJsonRaw);
        } catch (e) {
        }
        var componentToSave = Object.assign({}, component);
        if (currentJson)
          componentToSave.components = currentJson.components;
        if (!componentToSave.components)
          componentToSave.components = {};
        delete componentToSave.path;
        !newSettings.copyInProject &&
        await fsPromises.writeFile(componentPathJSON, JSON.stringify(componentToSave, null, 2), 'utf8');
        // update or create the JSON, end.
        var nameSplitted = component.name.split("/")
        var isSubComponent = nameSplitted.length > 1;
        if (isSubComponent) {
          nameSplitted.pop();
          var isComponent = components[project.name];
          if (isComponent) {
            project.components[project.name] = Object.assign({}, isComponent);
            project.components[project.name].path = "";
          }
          var openComponents = await readComponentsJSON(project.components, $self.serverPath + "/");
          var componentsFlat = getComponentsFlat(openComponents);
          var parent = componentsFlat[nameSplitted.join("/")]
          if (!parent.components ||
            typeof parent.components !== "object" ||
            Array.isArray(parent.components)) {
            parent.components = {}
          }
          parent.components[component.name] =
            {
              name: component.name,
              path: component.path
            };
          for (var k in parent.components) {
            var newObj = {};
            var pc = parent.components[k];
            newObj.path = pc.path.replace(parent.path, "");
            newObj.name = pc.name;
            parent.components[k] = newObj;
          }
          var getParentJsonPath = $self.serverPath + parent.path
            + "/tilepieces.component.json";
          delete parent.path;
          await fsPromises.writeFile(getParentJsonPath, JSON.stringify(parent, null, 2), 'utf8');
        } else {
          if (!project.components ||
            typeof project.components !== "object" ||
            Array.isArray(project.components)) {
            project.components = {}
          }
          project.components[component.name] = {name: component.name, path: component.path}
          delete project.path;
          await fsPromises.writeFile($self.serverPath + "/tilepieces.project.json",
            JSON.stringify(project, null, 2), 'utf8');
        }
      } else {
        component.path = component.path ||
          $self.serverPath; // "components/comp"
        component.components = components.components || components[component.name]?.components || {};
        components[component.name] = {name: component.name, path: component.path};
        var componentToSave = Object.assign({}, component);
        for (var k in componentToSave.components) {
          var c = componentToSave.components[k];
          componentToSave.components[k] = {name: c.name, path: c.path}
        }
        delete componentToSave.path;
        await createDir(component.path);
        await fsPromises.writeFile(component.path + "/tilepieces.component.json",
          JSON.stringify(componentToSave, null, 2), 'utf8');
        var newComponents = Object.assign({}, components);
        for (var k in newComponents) {
          var c = newComponents[k];
          newComponents[k] = {name: c.name, path: c.path}
        }
        await fsPromises.writeFile($self.basePath + "components.json",
          JSON.stringify(newComponents, null, 2), 'utf8');
      }
      for (var filesI = 0; filesI < files.length; filesI++) {
        var file = files[filesI];
        var newPathRoot = newSettings.local ?
          compPathInProj :
          "components/" + component.name + "/";
        var newPath = newPathRoot + file.path;
        var parent = path.dirname(newPath);
        try {
          await isDir(parent);
        } catch (e1) {
          try {
            await createDir(parent)
          } catch (e) {
            return writeResponse(res,
              {result: 0, path: newPath, error: e.toString()}, $self.headers);
          }
        }
        var ext = path.extname(newPath);
        var type = "binary";
        if (($self.mimeTypes[ext] && ($self.mimeTypes[ext].startsWith("text/") ||
          $self.mimeTypes[ext] == "application/json" ||
          $self.mimeTypes[ext].indexOf("+xml") > -1)) || ext == "")
          type = "utf8";
        await fsPromises.writeFile(newPath,
          file.fileArray, type);
      }
      writeResponse(res, {result: 1}, $self.headers);
    } catch (e) {
      console.error("[error from component create]", e);
      return writeResponse(res,
        {result: 0, err: e.toString()}, $self.headers);
    }
  });
  req.pipe(busboy);
}