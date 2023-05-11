import $ from "jquery";
import { ExtensionConfig, getExtensionConfig } from "./extensionConfig";
import { RuntimeMessage } from "./message";

let extensionConfig: ExtensionConfig;

const initializePromise = (async function () {
  extensionConfig = await getExtensionConfig();
})();

// Listen for messages from the loaded page, and forward them to devtools.
window.addEventListener("consoleMessage", function (e: Event) {
  const customEvent = e as CustomEvent;
  sendMessage({
    from: "content-script",
    to: "devtools",
    type: customEvent.type,
    level: customEvent.detail.level,
    message: customEvent.detail.message,
  });
});

// Listen for messages from background script
const port = chrome.runtime.connect({
  name: "content-script",
});
port.onMessage.addListener((message) => {
  if (message.to !== "content-script") {
    return;
  }

  // send config to dev tool when it's open.
  switch (message.type) {
    case "devToolsOpen":
      sendMessage({
        from: "content-script",
        to: "devtools",
        type: "extensionConfig",
        extensionConfig,
      });
      break;
    case "extensionConfig":
      // report extension config to the loaded page.
      extensionConfig = message.extensionConfig;
      window.dispatchEvent(new CustomEvent("extensionConfig", { detail: { extensionConfig } }));
      break;
    default:
      break;
  }
});

function sendMessage(message: RuntimeMessage): void {
  port.postMessage(message);
}

async function injectScriptTag(src: string): Promise<void> {
  const scriptElement = document.createElement("script");
  const promise = new Promise<void>((resolve) => {
    scriptElement.onload = () => {
      resolve();
    };
  });
  scriptElement.setAttribute("src", src);
  document.head.appendChild(scriptElement);

  return promise;
}

function initialize() {
  const scriptInjectionPromises = [];
  scriptInjectionPromises.push(injectScriptTag(chrome.runtime.getURL("inject_consoleLog.js")));
  scriptInjectionPromises.push(injectScriptTag(chrome.runtime.getURL("inject_imagePopup.js")));

  Promise.allSettled([...scriptInjectionPromises, initializePromise]).then(() => {
    // report extension config to runtime upon new page load.
    sendMessage({
      from: "content-script",
      to: "devtools",
      type: "extensionConfig",
      extensionConfig,
    });

    // report extensionConfig to the loaded page.
    window.dispatchEvent(new CustomEvent("extensionConfig", { detail: { extensionConfig } }));
  });
}

$(function () {
  initialize();

  // Run initialize again upon page navigation.
  window.addEventListener("popstate", function () {
    initialize();
  });
});
