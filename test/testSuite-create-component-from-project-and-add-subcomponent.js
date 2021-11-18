async function createComponentFromProject(){
    logOnDocument("Create components","larger");
    //
    logOnDocument("- create component from project","large");
    //
    await storageInterface.createComponent({
        component : componentModel("test")
    });
    var settings = await storageInterface.getSettings();
    logOnDocument(
        assert(settings.settings.components["test"].name == "test","expect global component 'test'")
        ,"success");
    // read the main json
    var mainJson = await fetch("/components.json").then(res=>res.json());
    var isPathRight = (mainJson.test.path == "www\\test" || mainJson.test.path == "www/test");
    var test3 = isPathRight &&
        Object.values(mainJson).length == 1 &&
        Object.values(mainJson.test).length == 2;
    //
    logOnDocument(
        assert(test3,"check if /components.json is correct")
        ,"success");
    //
    logOnDocument("- create a local component, called 'local-test'","large");
    //
    await storageInterface.createComponent({
        local : true,
        component : componentModel("local-test")
    });
    settings = await storageInterface.getSettings();
    var projectTest = settings.settings.projects.find(v=>v.name == "test");
    logOnDocument(
        assert(projectTest.components["local-test"].name == "local-test",
            "local-test is saved as component in project settings")
        ,"success");
    var compcomponents = settings.settings.components["test"].components;
    logOnDocument(
        assert(!compcomponents || !compcomponents.find(v=>v.name=="local-test"),
            "while there is not a 'components' record in 'component' (no update, because is a component of the project, not of the component)")
        ,"success");
    var readNewDir = await storageInterface.read("components/local-test");
    var dirCorrectlyCreated =
        JSON.stringify({"tilepieces.component.json":"tilepieces.component.json"}) == JSON.stringify(readNewDir.value);
    logOnDocument(
        assert(dirCorrectlyCreated,"dir created and correctly readed")
        ,"success");
    //
    logOnDocument("- create a inner component, called 'test/local-test'","large");
    //
    var newComponentModel = componentModel("test/local-test");
    newComponentModel.path = "/components/test/local-test";
    await storageInterface.createComponent({
        local : true,
        component : newComponentModel
    });
    settings = await storageInterface.getSettings();
    projectTest = settings.settings.projects.find(v=>v.name == "test");
    logOnDocument(
        assert(projectTest.componentsFlat["test/local-test"].name == "test/local-test",
            "test/local-test is in 'componentsFlat' record inside 'test' project")
        ,"success");
    logOnDocument(
        assert(projectTest.components.test.components["test/local-test"].name == "test/local-test",
            "test/local-test is in 'components' record inside 'test' component in 'test' project")
        ,"success");
    logOnDocument(
        assert(settings.settings.components["test"].components["test/local-test"].name == "test/local-test",
            "there is a component 'test/local-test' recorded in 'test' component")
        ,"success");
    readNewDir = await storageInterface.read("components/test/local-test");
    dirCorrectlyCreated =
        JSON.stringify({"tilepieces.component.json":"tilepieces.component.json"}) == JSON.stringify(readNewDir.value);
    logOnDocument(
        assert(dirCorrectlyCreated,"dir created and correctly readed")
        ,"success");
    // read the main json remain the same
    mainJson = await fetch("/components.json").then(res=>res.json());
    isPathRight = (mainJson.test.path == "www\\test" || mainJson.test.path == "www/test");
    test3 = isPathRight &&
        Object.values(mainJson).length == 1 &&
        Object.values(mainJson.test).length == 2;
    logOnDocument(
        assert(test3,"check if /components.json is correct")
        ,"success");
    // now check the components json
    var cJson = await storageInterface.read("tilepieces.component.json").then(res=>JSON.parse(res));
    logOnDocument(
        assert(cJson.name == "test" &&
            Object.values(cJson.components).length == 1 &&
            cJson.components["test/local-test"].path == "/components/test/local-test"
            ,"check if /components.json is correct")
        ,"success");
    // check the project json
    var projectJson = await storageInterface.read("tilepieces.project.json").then(res=>JSON.parse(res));
    logOnDocument(
        assert(projectJson.name == "test" &&
            Object.values(projectJson.components).length == 2 &&
            projectJson.components["test/local-test"].path == "/components/test/local-test" &&
            projectJson.components["local-test"].path == "/components/local-test"
            ,"check if /project.json is correct")
        ,"success");
    // now check if there are the inner components files
    var cJson1 = await storageInterface.read("components/test/local-test/tilepieces.component.json")
        .then(res=>JSON.parse(res));
    var cJson2 = await storageInterface.read("components/local-test/tilepieces.component.json")
        .then(res=>JSON.parse(res));
    logOnDocument(
        assert(cJson1.name == "test/local-test" &&
            cJson2.name == "local-test"
            ,"check if inner components json is correct")
        ,"success");
}