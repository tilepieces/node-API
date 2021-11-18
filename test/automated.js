const mockSettings = require("../settings.json");
const path = require("path");
const fsPromises = require('fs').promises;
const server = require("@tilepieces/server");
const GET =  require("./testUtils/GET");
const zlib = require('zlib');
const assert = require("./testUtils/assert");
console.log("Welcome to @tilepieces/node-API automated test.");
console.log("Be sure to have projects.json,settings.json and components.json in root. Process must start from the root. Use npm test");
console.log("Be sure to not have another process running on port " + mockSettings.server.port ,"or EADDRINUSE error will be raised");
(async ()=> {
    try {
        console.log("- Create:\n\n");
    }
    catch (e) {
        console.error("test failed");
        console.error(e);
    }
})();