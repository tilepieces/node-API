const fs = require("fs");
const p = require("path");
const writeResponse = require("../utils/writeResponse");
const readSettings = require("../utils/readSettings");
const createDir = require("../utils/createDir");
const removeProject = require("../utils/removeProject");
const isDir = require("../utils/isDir");
const deleteFolder = require("../utils/deleteFolder");
const moveToProject = require("../utils/moveToProject");
const readProjects = require("../utils/readProjects");
module.exports = async function(req,res,$self){
    var { url } = req;
    var currentProject = req.headers['current-project'];
    var urlParams = new URLSearchParams(url);
    var path = urlParams.get('path');
    var project = urlParams.get('project');
    if(currentProject && !project && currentProject != $self.projectName){
        try {
            await moveToProject(currentProject,$self)
        }
        catch(e){
            return writeResponse(res,{result:0,error:e},$self.headers);
        }
    }
    console.log("[DELETE]", url, path,project,currentProject);
    var prEntry;
    if(project) {
        try {
            var projects = await readProjects($self.basePath);
        }
        catch(e){
            return writeResponse(res,
                {result: 0, err: e.toString()}, $self.headers);
        }
        prEntry = projects.find(v=>v.name == project);
    }
    if(!$self.projectName && !prEntry)
        return writeResponse(res,
            {result: 0, error: "no project name activated", path}, $self.headers);

    var rootPath = prEntry ? prEntry.path : $self.serverPath;
    var filePath = p.resolve(rootPath,path);
    isDir(filePath)
    .then(async isDir=>{
        if(isDir)
            try {
                deleteFolder(filePath);
                if(project && (!path || path == "/")){
                    try {
                        await removeProject(project ,projects,$self.basePath)
                    }
                    catch(e){
                        return writeResponse(res,
                            {result: 0,
                                error: "project " + $self.projectName +" removed, but" +
                                " error on trying to delete entry in projects.json: " + e.toString(),
                                path}, $self.headers);
                    }
                }
                writeResponse(res, {result: 1, path}, $self.headers);
            }
            catch(e){
                return writeResponse(res,
                    {result: 0, error: e.toString(), path}, $self.headers)
            }
        else
            fs.unlink(filePath,async err => {
                if (err)
                    writeResponse(res,
                        {result: 0, error: err.toString(), path}, $self.headers);
                else
                    writeResponse(res, {result: 1, path}, $self.headers);
            });
    })
    .catch(e=>writeResponse(res,
        {result: 0, error: e.toString(), path}, $self.headers));
};