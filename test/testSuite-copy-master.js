async function copy(targetPath,destPath) {
  logOnDocument("copy", "larger");
  var copy1 = await storageInterface.copy(
    targetPath, destPath, true);
  logOnDocument(
    assert(copy1 == destPath,
      "copy1 == " + destPath +"")
    , "success");
  read = await storageInterface.read(destPath);
  logOnDocument(
    assert(read == "alert('ok from js/vendor/test.js')",
      "copyJs/vendor/test.js copied to test-copy.js")
    , "success");
  var read2;
  try {
    read2 = await storageInterface.read("copyJs/vendor/test.js");
  } catch (e) {
    logOnDocument("copyJs/vendor/test.js correctly moved", "success")
  }
  if (read2)
    logOnDocument("copyJs/vendor/test.js was not moved", "error")
}