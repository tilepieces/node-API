const fs = require("fs");
module.exports = function(file){
    return new Promise((res,rej)=>{
        fs.stat(file, (err, stats)=>{
            if(err) return rej(err);
            res(stats.isDirectory());
        })
    });
}