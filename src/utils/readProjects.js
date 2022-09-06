const fs = require("fs");
const path = require("path");
const fsPromises = require('fs').promises;
module.exports = function (basePath) {
  return new Promise((res, rej) => {
    fs.readFile(basePath + "projects.json", 'utf8', async (err, data) => {
      if (err)
        rej(err);
      else {
        var projects,projectsClone;
        try {
          projectsClone = JSON.parse(data);
          projects = [];
          for (var i = 0; i < projectsClone.length; i++) {
            var p = projectsClone[i];
            var projectPathJSON = path.normalize(
              (p.path || basePath) + "/tilepieces.project.json");
            try{
              var projectFile = await fsPromises.readFile(projectPathJSON, 'utf8');
              projects.push(Object.assign({}, JSON.parse(projectFile), p));
            }
            catch(e){}
          }
        } catch (e) {
          console.log("[error in parsing project]", data);
          console.log("[error in parsing project] typeof data ->", typeof data);
          rej(e);
        }
        res(projects)
      }
    });
  })
}