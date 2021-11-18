const fs = require("fs");
const path = require("path");
const fsPromises = require('fs').promises;
const writeResponse = require("../utils/writeResponse");
const readDir = require("../utils/readDir");
const moveToProject = require("../utils/moveToProject");
module.exports = async function(req,res,$self){
    var urlParams = new URLSearchParams(req.url);
    var currentProject = req.headers['current-project'];
    var p = urlParams.get('path');
    var componentName = urlParams.get("component");
    var projectName = urlParams.get("project");
    if(currentProject && !projectName && !componentName && currentProject != $self.projectName){
        try {
            await moveToProject(currentProject,$self)
        }
        catch(e){
            return writeResponse(res,{result:0,error:e},$self.headers);
        }
    }
    console.log("[READ]", p, componentName,currentProject);
    var startPath = $self.serverPath;
    if(componentName) {
        try {
            var components = JSON.parse(await fsPromises.readFile($self.basePath + "components.json", 'utf8'));
        }
        catch(e){
            return writeResponse(res, {result: 0, path:p, error: e.toString(),componentName}, $self.headers,404);
        }
        var c = components[componentName];
        if(c)
            startPath = c.path;
        else
            return writeResponse(res,
                {result: 0, error: "component " + componentName + " not found"}, $self.headers, 404);
    }
    if(projectName) {
        try {
            var projects = JSON.parse(await fsPromises.readFile($self.basePath + "projects.json", 'utf8'));
        }
        catch(e){
            return writeResponse(res, {result: 0, path:p, error: e.toString(),projectName}, $self.headers,404);
        }
        var ppkg = projects.find(v=>v.name == projectName);
        if(ppkg)
            startPath = ppkg.path;
        else
            return writeResponse(res,
                {result: 0, error: "project not found"}, $self.headers, 404);
    }
    if(p.match(/^[\\/]/))
        p = p.substr(1,p.length);
    var filePath = path.join(startPath,p);
    fs.stat(filePath,async (accessError,stats)=> {
        if (accessError)
            return writeResponse(res,
                {result: 0, error: accessError.toString(), path:p}, $self.headers, 404);
        if (stats.isDirectory()) {
            try {
                var dirJSON = await readDir(filePath);
            }
            catch (e) {
                return writeResponse(res, {result: 0, path:p, error: e.toString()}, $self.headers,404);
            }
            return writeResponse(res, {result: 1, path:p, value: dirJSON},
                Object.assign({},$self.headers,{"tilepieces-directory" : true}),200);
        }
        else {
            $self.send(filePath, res, $self.headers, 200, stats.mtimeMs);
        }
    })
};