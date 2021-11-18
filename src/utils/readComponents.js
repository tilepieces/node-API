const fs = require("fs");
const path = require("path");
const fsPromises = require('fs').promises;
async function readComponents(components,startingPath = "",basePath = ""){
    for(var k in components){
        var c = components[k];
        var startPath = !startingPath && !c.path ? basePath : startingPath + c.path;
        var componentPathJSON = path.normalize(
            startPath + "/tilepieces.component.json");
        try {
            var componentFile = await fsPromises.readFile(componentPathJSON, 'utf8');
            var component = JSON.parse(componentFile)
        }
        catch(e){
            console.error("[error on trying to read file component] ->",c.name);
            console.error(e);
            continue;
        }
        component.components = await readComponents(component.components,startPath,basePath);
        components[k] = Object.assign({},component,c);

    }
    return components;
}
module.exports = function (basePath){
    return new Promise((res,rej)=>{
        fs.readFile(basePath + "components.json", 'utf8',async (err,data)=>{
            if(err)
                rej(err);
            else {
                var components,cRaw;
                try {
                    cRaw = JSON.parse(data);
                    components = await readComponents(cRaw,"",basePath);
                }
                catch(e){
                    console.log("[error in parsing components]",data);
                    console.log(e);
                    rej(e);
                }
                res(components)
            }
        });
    })
}