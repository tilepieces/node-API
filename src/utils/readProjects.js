const fs = require("fs");
const path = require("path");
const fsPromises = require('fs').promises;
module.exports = function(basePath){
    return new Promise((res,rej)=>{
        fs.readFile(basePath + "projects.json", 'utf8',async (err,data)=>{
            if(err)
                rej(err);
            else {
                var projects;
                try {
                    projects = JSON.parse(data);
                    for(var i = 0;i<projects.length;i++){
                        var p = projects[i];
                        var projectPathJSON = path.normalize(
                            (p.path || basePath) + "/tilepieces.project.json");
                        var projectFile = await fsPromises.readFile(projectPathJSON, 'utf8');
                        projects[i] = Object.assign({},JSON.parse(projectFile),p);
                    }
                }
                catch(e){
                    console.log("[error in parsing project]",data);
                    console.log("[error in parsing project] typeof data ->",typeof data);
                    rej(e);
                }
                res(projects)
            }
        });
    })
}