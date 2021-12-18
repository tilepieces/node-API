module.exports = function pathToNix(p) {
  var path_regex = /\/\//;
  p = p.replace(/\\/g, "/");
  while (p.match(path_regex)) {
    p = p.replace(path_regex, "/");
  }
  return p;
}