type consoleOutputFunctionType = (...data: any[]) => void;

let oldConsoleLog: consoleOutputFunctionType | undefined;
let oldConsoleWarn: consoleOutputFunctionType | undefined;
let oldConsoleError: consoleOutputFunctionType | undefined;
let oldConsoleDebug: consoleOutputFunctionType | undefined;

function isFluidConsoleLog(args: any[]) {
  return args.length === 4 && args[0] == "%cPurple: %c%s";
}

function shouldByPassConsoleLog(): boolean {
  return (window as any).bypassConsoleLog;
}

if (!oldConsoleLog) {
  oldConsoleLog = console.log;

  console.log = function () {
    let args = Array.prototype.slice.call(arguments);
    if (isFluidConsoleLog(args)) {
      let message = args[3];
      let event = new CustomEvent("consoleMessage", {
        detail: { level: "log", message: message },
      });
      window.dispatchEvent(event);
      if (shouldByPassConsoleLog()) {
        return;
      }
    }

    oldConsoleLog?.apply(console, args);
  };
}

if (!oldConsoleWarn) {
  oldConsoleWarn = console.warn;

  console.warn = function () {
    let args = Array.prototype.slice.call(arguments);
    if (isFluidConsoleLog(args)) {
      let message = args[3];
      let event = new CustomEvent("consoleMessage", {
        detail: { level: "warn", message: message },
      });
      window.dispatchEvent(event);
      if (shouldByPassConsoleLog()) {
        return;
      }
    }

    oldConsoleWarn?.apply(console, args);
  };
}

if (!oldConsoleError) {
  oldConsoleError = console.error;

  console.error = function () {
    let args = Array.prototype.slice.call(arguments);
    if (isFluidConsoleLog(args)) {
      let message = args[3];
      let event = new CustomEvent("consoleMessage", {
        detail: { level: "error", message: message },
      });
      window.dispatchEvent(event);
      if (shouldByPassConsoleLog()) {
        return;
      }
    }

    oldConsoleError?.apply(console, args);
  };
}

if (!oldConsoleDebug) {
  oldConsoleDebug = console.debug;

  console.debug = function () {
    let args = Array.prototype.slice.call(arguments);
    if (isFluidConsoleLog(args)) {
      let message = args[3];
      let event = new CustomEvent("consoleMessage", {
        detail: { level: "debug", message: message },
      });
      window.dispatchEvent(event);
      if (shouldByPassConsoleLog()) {
        return;
      }
    }

    oldConsoleDebug?.apply(console, args);
  };
}
