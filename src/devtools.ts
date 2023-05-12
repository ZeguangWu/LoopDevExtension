import { RuntimeMessage } from "./message";

import * as ConsoleLogViewer from "./extensionModules/ConsoleLogViewer/devtools";

// Listen for messages from background script
let port: chrome.runtime.Port;
function connect() {
  port = chrome.runtime.connect({
    name: `devtools:${chrome.devtools.inspectedWindow.tabId}`,
  });

  // auto reconnect.
  port.onDisconnect.addListener(connect);

  port.onMessage.addListener((message: RuntimeMessage) => {
    if (message.to !== "devtools") {
      return;
    }
  });
}

async function initialize() {
  // Register extension modules.
  ConsoleLogViewer.devtools(port);

  port.postMessage({
    from: "devtools",
    to: "content-script",
    type: "devToolsOpen",
  });
}

connect();
initialize();
