const fs = require("fs");
const path = require("path");
const readProjects = require("./readProjects");
const fsPromises = require('fs').promises;
module.exports = function(projectName,projects,basePath){
    return new Promise(async (resolve,reject)=>{
        try {
            var componentsRaw = await fsPromises.readFile(basePath + "components.json", 'utf8');
        }
        catch(e){
            return reject(e);
        }
        var components = JSON.parse(componentsRaw);
        var findIndex = projects.findIndex(p=>p.name==projectName);
        var project = projects[findIndex];
        var isComponent = components[project.name];
        if(isComponent) {
            delete components[isComponent.name];
            try {
                await fsPromises.writeFile(basePath + "components.json",
                    JSON.stringify(components), 'utf8');
            }
            catch(e){
                reject(e);
            }
        }
        projects.splice(findIndex,1);
        projects = projects.map(v=>{
            return {name:v.name,path:v.path,components:v.components}
        })
        fs.writeFile(basePath + "projects.json",
            JSON.stringify(projects), 'utf8', err=> {
                if (err)
                    reject(err);
                else
                    resolve();
            }
        );
    })
}