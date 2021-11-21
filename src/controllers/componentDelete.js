const writeResponse = require("../utils/writeResponse");
const readSettings = require("../utils/readSettings");
const readProjects = require("../utils/readProjects");
const readComponents = require("../utils/readComponents");
const updateProjects = require("../utils/updateProjects");
const fsPromises = require('fs').promises;
const fs = require("fs");
const path = require("path");
const moveToProject = require("../utils/moveToProject");
const deleteFolder = require("../utils/deleteFolder");
module.exports = async function(req,res,$self){
  var currentProject = req.headers['current-project'];
  if(currentProject && currentProject != $self.projectName){
    try {
      await moveToProject(currentProject,$self)
    }
    catch(e){
      return writeResponse(res,{result:0,error:e},$self.headers);
    }
  }
  console.log("[COMPONENT DELETE] ",req.method,req.url,currentProject);
  try {
    var body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
      body = Buffer.concat(body).toString();
      var newSettings = JSON.parse(body);
      try {
          var projects = await readProjects($self.basePath);
      }
      catch(e){
          return writeResponse(res,
              {result: 0, err: e.toString()}, $self.headers);
      }
      var project = projects.find(v=>v.name == $self.projectName);
      var componentFile;
      var components = {};
      try {
          components = await readComponents($self.basePath);
      }
      catch(e){}
      var component = newSettings.component;
        if(newSettings.local){
          var currentComponent = components[project.name];
          var isSavedComponent = false;
          if(!project.components || typeof project.components !== "object" || Array.isArray(project.components)) {
              project.components = {}
          }
          var nameSplitted = component.name.split("/")
          var isSubComponent = nameSplitted.length > 1;
          var parentComponentIsCurrentComponent = nameSplitted.length == 2 && nameSplitted[0] == currentComponent.name;
          var deletedPath = "";
          for(var k in project.components)
            if(k == component.name) {
              if(newSettings.deleteFiles){
                deletedPath = $self.serverPath + project.components[k].path;
                deleteFolder(deletedPath);
              }
              delete project.components[k];
            }
          if(currentComponent){
            for(var ki in currentComponent.components)
              if(ki == component.name) {
                if(newSettings.deleteFiles && !deletedPath){
                  deleteFolder($self.serverPath + currentComponent.components[ki].path);
                }
                delete currentComponent.components[ki];
                isSavedComponent = true;
              }
          }
          // save the project components reference
          if(!isSubComponent) {
            var projectToSave = Object.assign({}, project);
            delete projectToSave.path;
            // update project data
            await fsPromises.writeFile((project.path || $self.basePath) + "/tilepieces.project.json",
              JSON.stringify(projectToSave, null, 2), 'utf8');
          }
          else if(!parentComponentIsCurrentComponent){ // save the correct record in the parent component
            nameSplitted.pop();
            var componentParent = project;
            var pathToDelete = (project.path||$self.basePath)
            nameSplitted.forEach(v=>{
              componentParent = componentParent.components[v];
              pathToDelete+="/" + componentParent.path;
            })
            if(newSettings.deleteFiles){
              console.log("delete component at path " + newSettings.deleteFiles);
              deleteFolder(pathToDelete);
            }
            var getParentJsonPath = path.resolve((project.path||$self.basePath) + componentParent.path )
              + "/tilepieces.component.json";
            var getParentJsonRaw = await fsPromises.readFile(getParentJsonPath, 'utf8');
            var getParentJson = JSON.parse(getParentJsonRaw);
            delete getParentJson.components[component.name]
            await fsPromises.writeFile(getParentJsonPath,JSON.stringify(getParentJson,null,2), 'utf8');
          }
          // save the main component json
          var componentToSave = Object.assign({},currentComponent);
          for(var k in componentToSave.components){
              var c = componentToSave.components[k];
              componentToSave.components[k] = {name:c.name,path:c.path}
          }
          delete componentToSave.path;
          isSavedComponent && await fsPromises.writeFile($self.serverPath + "/tilepieces.component.json",
              JSON.stringify(componentToSave,null,2), 'utf8');
        }
        else{
          if (components[component.name]) {
            if(newSettings.deleteFiles){
              deleteFolder(components[component.name].path);
            }
            delete components[component.name];
          }
          var newComponents = Object.assign({},components);
          for(var k in newComponents){
              var c = newComponents[k];
              newComponents[k] = {name:c.name,path:c.path}
          }
          await fsPromises.writeFile($self.basePath + "components.json",
              JSON.stringify(newComponents), 'utf8');
        }
        writeResponse(res, {result: 1}, $self.headers);
    });
  }
  catch(e){
      return writeResponse(res,
          {result: 0, err: e.toString()}, $self.headers);
  }
};