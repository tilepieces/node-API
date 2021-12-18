const glob = require("glob");
module.exports = function (m) {
  return new Promise((res, rej) => {
    glob(m, {}, function (err, files) {
      if (err) {
        console.log(err);
        res([]);
      }
      res(files);
    });
  });
}