const fs = require("fs");
module.exports = (projects,basePath)=> {
    return new Promise((res, rej)=> {
        console.log("update project launched");
        fs.writeFile(basePath + "projects.json",
            JSON.stringify(projects.map(p=>{
                return {name:p.name,path:p.path}
            }),null,2), 'utf8', err=> {
                console.log("update project terminated");
                if (err)
                    rej(err);
                else
                    res();
            })
    });
}