module.exports = [
    {
        url : "/?tilepieces-create",
        method : "GET",
        controller : require(__dirname + "/src/controllers/create")
    },
    {
        url : "/?tilepieces-read",
        method : "GET",
        controller : require(__dirname + "/src/controllers/read")
    },
    {
        url : "/?tilepieces-update",
        method : "POST",
        controller : require(__dirname + "/src/controllers/update")
    },
    {
        url : "/?tilepieces-delete",
        method : "GET",
        controller : require(__dirname + "/src/controllers/delete")
    },
    {
        url : "/?tilepieces-copy",
        method : "GET",
        controller : require(__dirname + "/src/controllers/copy")
    },
    {
        url : "/?tilepieces-component-create",
        method : "POST",
        controller : require(__dirname + "/src/controllers/componentCreate")
    },
    {
        url : "/?tilepieces-component-delete",
        method : "POST",
        controller : require(__dirname + "/src/controllers/componentDelete")
    },
    {
        url : "/?tilepieces-settings",
        method : "GET",
        controller : require(__dirname + "/src/controllers/settingsGet")
    },
    {
        url : "/?tilepieces-settings",
        method : "POST",
        controller : require(__dirname + "/src/controllers/settingsPost")
    },
    {
        url : "/?tilepieces-search",
        method : "POST",
        controller : require(__dirname + "/src/controllers/search")
    }
];