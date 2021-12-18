const fs = require("fs");
module.exports = function (name) {
  return new Promise((res, rej) => {
    fs.mkdir(name, {recursive: true}, err => {
      if (err)
        rej(err);
      else
        res();
    })
  })
}