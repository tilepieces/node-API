const path = require("path");
const fsPromises = require('fs').promises;
async function readComponentsJSON(components,startingPath = "",basePath = ""){
  for(var k in components){
    var c = components[k];
    var startPath = !startingPath && !c.path ? basePath : startingPath + c.path;
    var componentPathJSON = path.normalize(
      startPath + "/tilepieces.component.json");
    try {
      var componentFile = await fsPromises.readFile(componentPathJSON, 'utf8');
      var component = JSON.parse(componentFile)
    }
    catch(e){
      console.error("[error on trying to read file component] ->",c.name);
      console.error(e);
      continue;
    }
    component.components = await readComponentsJSON(component.components,startPath,basePath);
    components[k] = Object.assign({},component,c);

  }
  return components;
}
module.exports = readComponentsJSON;