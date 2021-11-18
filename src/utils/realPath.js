const fs = require("fs");
module.exports = function(file){
    return new Promise((res,rej)=>{
        fs.realpath(file, (err, p)=>{
            if(err) return rej(err);
            res(p);
        })
    });
}