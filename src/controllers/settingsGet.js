const writeResponse = require("../utils/writeResponse");
const readSettings = require("../utils/readSettings");
const readProjects = require("../utils/readProjects");
const readComponents = require("../utils/readComponents");
const fsPromises = require('fs').promises;
const readFile = require("../utils/readFile");
const setLocalComponentsTree = require("../utils/setLocalComponentsTree");
const path = require("path");
const moveToProject = require("../utils/moveToProject");
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
    console.log("[SETTINGS] ",req.method,req.url,currentProject);
    try {
        var settings = {};
        settings.globalSettings = await readSettings($self.basePath);
        settings.projects = await readProjects($self.basePath);
        var components = {};
        try {
            components = await readComponents($self.basePath);
        }
        catch(e){}
        for(var projectsI = 0;projectsI<settings.projects.length;projectsI++){
            var project = settings.projects[projectsI];
            project.localComponents = {};
            for(var name in project.components){
              var pkg = project.components[name];
              var componentFile = await fsPromises.readFile(
                  path.normalize((project.path||$self.basePath) + "/" + pkg.path + "/tilepieces.component.json")
              );
              project.localComponents[name] = Object.assign(JSON.parse(componentFile),pkg);
              project.components[name] = project.localComponents[name];
            }
            /*
            alternative isComponent
            var isComponent = Object.values(components).find(c=>
             c.path == v.path ||
             path.join($self.basePath, v.path) == c.path ||
             path.join($self.basePath, v.path) == path.join($self.basePath, c.path)
            );*/
            var isComponent = components[project.name];
            project.isComponent = isComponent && Object.assign({},isComponent);
            if(project.isComponent)
                delete project.isComponent.path;
            delete project.path;
            project.componentPackage = project.isComponent;
            if(project.isComponent) {
                project.localComponents[project.name] = Object.assign({}, isComponent);
                project.localComponents[project.name].components = {};
            }
            project.componentsFlat = project.localComponents;
            try {
                project.components = setLocalComponentsTree(project.localComponents);
            }
            catch(e){
                console.error("[settingsGet cannot associate components]");
                console.error("[get parent component error] name -> ",project.name);
            }
            project.localComponents[project.name] && delete project.localComponents[project.name].path;
        }
        for(var k in components)
            delete components[k].path
        settings.components = components;
        writeResponse(res, {settings, result: 1}, $self.headers);
    }
    catch(e){
        console.log(e);
        return writeResponse(res,
            { result: 0, err: e.toString()}, $self.headers);
    }
};