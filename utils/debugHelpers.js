function getCallerInfo() {
  const originalFunc = Error.prepareStackTrace;

  let callerFile, previousCallerFile;
  try {
    const err = new Error();
    Error.prepareStackTrace = (err, stack) => stack;
    const currentFile = err.stack.shift().getFileName(); // Get current file (the one calling this function)

    // Loop through the call stack to find the immediate caller and previous caller
    while (err.stack.length) {
      previousCallerFile = callerFile; // Keep track of the previous caller
      callerFile = err.stack.shift().getFileName();
      if (callerFile !== currentFile) break; // Break when finding the first caller outside the current file
    }
  } catch (error) {
    console.error('Error finding the caller module', error);
  } finally {
    Error.prepareStackTrace = originalFunc;
  }

  return { immediateCaller: callerFile, previousCaller: previousCallerFile };
}

module.exports = getCallerInfo;