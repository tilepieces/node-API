const fs = require("fs");
const path = require("path");
const isDir = require("./isDir");
let ffiles = [];
async function inner(dir,files,final){
    var dirs = [];
    var f = [];
    for (var i = 0; i < files.length; i++) {
        var file = dir + files[i];
        var isdir;
        try {
            isdir = await isDir(file);
        }
        catch(e){
            console.log(e);
            continue
        }
        if(isdir) {
            dirs.push(file);
            try {
                var inn = await readDirRecursively(file,final);
            }
            catch(e){
                console.log(e);
            }
            final.concat(inn);
            //ffiles.concat(inn);
        }
        else
            f.push(file)
    }
    final = dirs.sort().concat(f.sort()).concat(final);
    return final;
    //ffiles = ffiles.concat();
}
function readDirRecursively(dir,final = []){
    if(dir.charAt(dir.length-1) != path.sep)
        dir+=path.sep;
    return new Promise((res,rej)=>{
        fs.readdir(dir, async (err, f)=> {
            if(err) return rej(err);
            var files = await inner(dir,f,final);
            res(final.concat(files));
        });
    });
}
module.exports = readDirRecursively;