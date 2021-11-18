const fs = require('fs');
const globMatch = require("./globMatch");
const path = require('path');
const isDir = require("./isDir");
const minimatch = require("minimatch");
const readFile = require("./readFile");
const realPath = require("./realPath");
const pathToNix = require("./pathToNix");
async function returnFolderFiles(dir,filelist,rg,originalPath) {
    filelist = filelist || [];
    if( dir[dir.length-1] != path.sep) dir=dir.concat(path.sep);
    return new Promise((resolve,reject)=>{
        fs.readdir(dir,async (err,files)=>{
            if(err)
                return reject(err);
            for(var i = 0;i<files.length;i++) {
                try {
                    await (function (i) {
                        return new Promise((res, rej)=> {
                            var file = dir + files[i];
                            fs.lstat(file, async (err, data)=> {
                                if (err)
                                    return rej(err);
                                var isDirectory = data.isDirectory();
                                var fileMatch = path.relative(originalPath,file);
                                if (isDirectory)
                                    filelist = await
                                        returnFolderFiles(file, filelist,rg,originalPath);
                                else {
                                    if(rg) {
                                        var f = await readFile(file);
                                        var m = f.match(rg);
                                        if(m)
                                            filelist.push(pathToNix(fileMatch));
                                    }
                                    else
                                        filelist.push(pathToNix(fileMatch));
                                }
                                res();
                            })
                        })
                    })(i);
                }
                catch(e){
                    reject(e);
                }
            }
            resolve(filelist)
        })
    })
}
module.exports = async (dir,match,rgFile) =>{
    var matches = match ? (Array.isArray(match) ? match : [match]) : null,
        originalDir = dir,
        rg;
    try {
        if(rgFile){
            //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
            var pattern = rgFile.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            rg = new RegExp(pattern, rgFile.flags)
        }
    }
    catch(e){}
    if(matches) {
        var result = [];
        for(var i = 0;i<matches.length;i++){
            var m = matches[i];
            var arr;
            var pathToFind = path.join(originalDir, m);
            var gmatches =await globMatch(pathToFind);
            for(var gmi = 0;gmi<gmatches.length;gmi++){
                var isdir;
                var matchPath = gmatches[gmi];
                try {
                    isdir = await isDir(matchPath);
                }
                catch (e) {
                    continue;
                }
                if (isdir) {
                    arr = await returnFolderFiles(matchPath, [], rg,originalDir);
                    result = result.concat(arr);
                }
                else{
                    if(rg) {
                        var f = await readFile(matchPath);
                        var m1 = f.match(rg);
                        if (m1)
                            result.push(pathToNix(path.relative(originalDir,matchPath)));
                    }
                    else
                        result.push(pathToNix(path.relative(originalDir,matchPath)));
                }
            }
        }
        result = result.filter((item,pos) => result.indexOf(item) === pos);
        return result;
    }
    return returnFolderFiles(dir, [], rg,originalDir)
}