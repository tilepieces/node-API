const readDir = require("../utils/readDir");
const isDir = require("../utils/isDir");
const createNewProject = require("../utils/createNewProject");
const updateProjects = require("../utils/updateProjects");
const readProjects = require("../utils/readProjects");
const path = require("path");
module.exports = function (name, $self) {
  console.log("[move project]", name);
  if (!name)
    throw "no project to move";
  return new Promise(async (resolve, rej) => {
    try {
      var projects = await readProjects($self.basePath);
    } catch (e) {
      return rej(e)
    }
    var prEntry = projects.find(v => v.name == name);
    $self.serverPath = prEntry ?
      prEntry.path :
      path.join($self.workspace, name);
    if (prEntry) {
      try {
        var checkDir = await isDir($self.serverPath || $self.basePath);
        if (!checkDir)
          return rej("path associated with project is not a directory.");
      } catch (e) {
        var errorDeleting = e;
        projects.splice(projects.findIndex(v => v.name == name), 1);
        try {
          await updateProjects(projects, $self.basePath)
        } catch (eup) {
          errorDeleting = "path associated with project is not a file. " +
            "Application tried to delete from project.json but an error has been raised:\n" + eup.toString();
        }
        return rej(errorDeleting.toString());
      }
      $self.projectName = name;
      projects.splice(projects.findIndex(v => v.name == name), 1);
      projects.unshift(prEntry);
      await updateProjects(projects, $self.basePath);
      resolve();
    } else rej("project doesn't not exists anymore")
  })
}