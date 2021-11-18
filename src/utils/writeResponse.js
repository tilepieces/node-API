const zlib = require('zlib');
module.exports = function(res,resObj,headers,status = 200){
    res.writeHead(status, Object.assign({"Content-Type": "application/json","Content-Encoding":"gzip"},headers));
    zlib.gzip(JSON.stringify(resObj), (err, buffer) => {
        if(err)
            throw err
        res.write(buffer);
        res.end();
    });
}