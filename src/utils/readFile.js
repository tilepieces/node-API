const fs = require("fs");
module.exports = function(path){
    return new Promise((res,rej)=>{
        fs.readFile(path, 'utf8',(err,data)=>{
            if(err)
                rej(err);
            else
                res(data)
        });
    })
}