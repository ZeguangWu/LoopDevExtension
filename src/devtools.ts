import * as ConsoleLogViewer from "./extensionModules/ConsoleLogViewer/devtools";
import { DevToolsInitContext } from "./contracts/devtoolsInitContext";

const moduleContexts: DevToolsInitContext[] = [];
let port: chrome.runtime.Port;
function connect() {
  port = chrome.runtime.connect({
    name: `devtools:${chrome.devtools.inspectedWindow.tabId}`,
  });

  // auto reconnect.
  // According to https://developer.chrome.com/docs/extensions/whatsnew/#m110-sw-idle,
  // An extension service worker will be shut down after either thirty seconds of inactivity. (╬▔皿▔)╯
  port.onDisconnect.addListener(() => {
    console.log("devtools port disconnected. reconnecting...");
    connect();
    console.log("devtools port reconnected.");
  });

  // invoke port change handlers in each module.
  moduleContexts.forEach((context) => {
    context.registerRuntimeMessagePort(port);
  });
}

async function initialize() {
  // Register extension modules.
  moduleContexts.push(await ConsoleLogViewer.devtools());
  connect();
}

initialize();
