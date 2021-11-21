function getComponentsFlat(components = {},total = {},path = ""){
  for(var k in components){
    var c = components[k]
    total[k] = c;
    var componentPath = path + c.path;
    total[k].path = componentPath;
    getComponentsFlat(c.components,total,componentPath)
  }
  return total;
}
module.exports = getComponentsFlat;