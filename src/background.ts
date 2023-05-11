import { RuntimeMessage, RuntimeMessageEndpoint } from "./message";

const ports: {
  contentScript: Map<number, chrome.runtime.Port>; // <tabId, port>
  devtools: Map<number, chrome.runtime.Port>; // <tabId, port>
  popup?: chrome.runtime.Port;
} = {
  contentScript: new Map(),
  devtools: new Map(),
};

chrome.runtime.onConnect.addListener(function (port) {
  console.log("onConnect", { port, ports });

  const parts = port.name.split(":");
  const sourceEndpoint = parts[0] as RuntimeMessageEndpoint;

  if (!sourceEndpoint) {
    return;
  }

  let tabId = parts[1] ? parseInt(parts[1]) : undefined;
  if (tabId === undefined) {
    tabId = port.sender?.tab?.id;
  }

  switch (sourceEndpoint) {
    case "content-script":
      if (tabId !== undefined) {
        ports.contentScript.set(tabId, port);
      }
      break;
    case "devtools":
      if (tabId !== undefined) {
        ports.devtools.set(tabId, port);
      }
      break;
    case "popup":
      ports.popup = port;
      break;
    default:
      break;
  }

  // dispatch messages.
  port.onMessage.addListener(function (message: RuntimeMessage, port: chrome.runtime.Port) {
    const to = message.to;
    const tabId = port.sender?.tab?.id;

    switch (to) {
      case "content-script":
        if (tabId !== undefined) {
          ports.contentScript.get(tabId)?.postMessage(message);
        } else if (message.from === "popup") {
          ports.contentScript.forEach((port) => {
            port.postMessage(message);
          });
        }
        break;
      case "devtools":
        if (tabId !== undefined) {
          ports.devtools.get(tabId)?.postMessage(message);
        } else if (message.from === "popup") {
          ports.devtools.forEach((port) => {
            port.postMessage(message);
          });
        }
        break;
      case "popup":
        ports.popup?.postMessage(message);
        break;
      default:
        break;
    }
  });

  // Clean up.
  port.onDisconnect.addListener(function (port) {
    console.log("onDisconnect", { port, ports });
    const sourceEndpoint = port.name as RuntimeMessageEndpoint;
    if (!sourceEndpoint) {
      return;
    }

    const tab = port.sender?.tab?.id;

    switch (sourceEndpoint) {
      case "content-script":
        if (tab !== undefined) {
          ports.contentScript.delete(tab);
        }
        break;
      case "devtools":
        if (tab !== undefined) {
          ports.devtools.delete(tab);
        }
        break;
      case "popup":
        ports.popup = undefined;
        break;
      default:
        break;
    }
  });
});
