function getComponentsFlat(components = {},total = {}){
  for(var k in components){
    var c = components[k]
    total[k] = c;
    getComponentsFlat(c.components,total)
  }
  return total;
}
module.exports = getComponentsFlat;