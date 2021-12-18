const createDir = require("./createDir");
const readFile = require("./readFile");
const updateProjects = require("./updateProjects");
const fsPromises = require('fs').promises;
module.exports = function (serverPath, projects, projectName, basePath) {
  return new Promise(async (resolve, reject) => {
    var newProjectJson = {
      name: projectName,
      path: serverPath,
      components: {}
    }
    try {
      await createDir(serverPath);
      try {
        await readFile(serverPath + "/tilepieces.project.json");
      } catch (e) {
        var projectClone = Object.assign({}, newProjectJson);
        delete projectClone.path;
        await fsPromises.writeFile(serverPath + "/tilepieces.project.json",
          JSON.stringify(projectClone, null, 2), 'utf8');
      }
    } catch (e) {
      reject(e);
    }
    projects.unshift(newProjectJson);
    updateProjects(projects, basePath)
      .then(() => resolve())
      .catch(e => reject(e));
  })
}