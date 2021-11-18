const fs = require("fs");
const path = require("path");
const Busboy = require('busboy');
const readSettings = require("../utils/readSettings");
const readProjects = require("../utils/readProjects");
const readComponents = require("../utils/readComponents");
const updateProjects = require("../utils/updateProjects");
const fsPromises = require('fs').promises;
const writeResponse = require("../utils/writeResponse");
const createDir = require("../utils/createDir");
const isDir = require("../utils/isDir");
const moveToProject = require("../utils/moveToProject");
const componentDir = "components";
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
    console.log("[COMPONENT CREATE] ",req.method,req.url,currentProject);
    var busboy = new Busboy({ headers: req.headers });
    var files = [];
    var newSettings;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var buf = [];
        file.on('data', function(data) {
            buf.push(data);
        });
        file.on('end', function() {
            files.push({
                fileArray : Buffer.concat(buf),
                path : fieldname
            })
        });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        if(fieldname == "newSettings")
            newSettings = val
    });
    busboy.on('finish', async () =>{
        try {
            newSettings = JSON.parse(newSettings);
            var projects = await readProjects($self.basePath);
            var project = projects.find(v=>v.name == $self.projectName);
            var compPathInProj = $self.serverPath + "/" + (project.componentPath || componentDir) + "/";
            var components = {};
            try {
                components = await readComponents($self.basePath);
            }
            catch(e){}
            var component = newSettings.component;
            if (newSettings.local) {
                var currentComponent = components[project.name];
                var isSavedComponent = false;
                if (!project.components || typeof project.components !== "object" || Array.isArray(project.components)) {
                    project.components = {}
                }
                component.path = component.path || ("/" + (project.componentPath || componentDir) + "/" + component.name);
                project.components[component.name] = {name:component.name,path:component.path};
                await createDir($self.serverPath + component.path);
                if (currentComponent &&
                    component.name.startsWith(currentComponent.name + "/")) {
                    if(!currentComponent.components ||
                        typeof project.components !== "object" ||
                        Array.isArray(currentComponent.components)) {
                        currentComponent.components = {}
                    }
                    currentComponent.components[component.name] = {name:component.name,path:component.path};
                    isSavedComponent = true;
                }
                // save the component json
                var componentPathJSON = (project.path||$self.basePath) + component.path + "/tilepieces.component.json";
                var componentToSave = Object.assign({},component);
                for(var k in componentToSave.components){
                    var c = componentToSave.components[k];
                    componentToSave.components[k] = {name:c.name,path:c.path}
                }
                delete componentToSave.path;
                await fsPromises.writeFile(componentPathJSON, JSON.stringify(componentToSave,null,2),'utf8');
                // save the project components reference
                var projectToSave = Object.assign({},project);
                delete projectToSave.path;
                // update project data
                await fsPromises.writeFile((project.path||$self.basePath) + "/tilepieces.project.json",
                    JSON.stringify(projectToSave,null,2),'utf8');
                // save the project component json
                componentToSave = Object.assign({},currentComponent);
                for(var k in componentToSave.components){
                    var c = componentToSave.components[k];
                    componentToSave.components[k] = {name:c.name,path:c.path}
                }
                delete componentToSave.path;
                isSavedComponent && await fsPromises.writeFile($self.serverPath + "/tilepieces.component.json",
                    JSON.stringify(componentToSave,null,2), 'utf8');
            }
            else {
                component.path = component.path ||
                    $self.serverPath; // "components/comp"
                components[component.name] = {name:component.name,path:component.path};
                var componentToSave = Object.assign({},component);
                for(var k in componentToSave.components){
                    var c = componentToSave.components[k];
                    componentToSave.components[k] = {name:c.name,path:c.path}
                }
                delete componentToSave.path;
                await createDir(component.path);
                await fsPromises.writeFile(component.path + "/tilepieces.component.json",
                    JSON.stringify(componentToSave,null,2),'utf8');
                var newComponents = Object.assign({},components);
                for(var k in newComponents){
                    var c = newComponents[k];
                    newComponents[k] = {name:c.name,path:c.path}
                }
                await fsPromises.writeFile($self.basePath + "components.json",
                    JSON.stringify(newComponents,null,2), 'utf8');
            }
            for(var filesI = 0;filesI<files.length;filesI++) {
                var file = files[filesI];
                var newPathRoot = newSettings.local ?
                    compPathInProj:
                    "components/";
                var newPath = newPathRoot + file.path;
                var parent = path.dirname(newPath);
                try {
                    await isDir(parent);
                }
                catch(e1){
                    try {
                        await createDir(parent)
                    }
                    catch(e){
                        return writeResponse(res,
                            {result: 0, path: newPath, error: e.toString()}, $self.headers);
                    }
                }
                var ext = path.extname(newPath);
                var type = "binary";
                if(($self.mimeTypes[ext] && ($self.mimeTypes[ext].startsWith("text/") ||
                    $self.mimeTypes[ext] == "application/json" ||
                    $self.mimeTypes[ext].indexOf("+xml")>-1)) || ext == "")
                    type = "utf8";
                await fsPromises.writeFile(newPath,
                    file.fileArray, type);
            }
            writeResponse(res, {result: 1}, $self.headers);
        }
        catch(e){
            return writeResponse(res,
                {result: 0, err: e.toString()}, $self.headers);
        }
    });
    req.pipe(busboy);
}