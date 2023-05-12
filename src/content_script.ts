import { ExtensionConfig, getExtensionConfig } from "./extensionConfig";
import { ContentScriptInitContext } from "./ContentScriptorInitContext";

import * as ConsoleLogViewer from "./extensionModules/ConsoleLogViewer/content_script";
import * as ImageEnhancement from "./extensionModules/ImageEnhancement/content_script";

let extensionConfig: ExtensionConfig;
const scriptInjectionPromises: Promise<void>[] = [];

// Listen for messages from background script
let port: chrome.runtime.Port;
function connect() {
  port = chrome.runtime.connect({
    name: "content-script",
  });

  // auto reconnect.
  port.onDisconnect.addListener(connect);
}
connect();

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

function initializeModule(context: ContentScriptInitContext) {
  context.injectedScripts.forEach((script) => {
    scriptInjectionPromises.push(injectScriptTag(script));
  });
}

async function initialize() {
  initializeModule(await ConsoleLogViewer.contentScript(port));
  initializeModule(await ImageEnhancement.contentScript(port));

  const extensionConfigPromise = getExtensionConfig().then((config) => (extensionConfig = config));
  Promise.allSettled([...scriptInjectionPromises, extensionConfigPromise]).then(() => {
    // report extension config to runtime upon new page load.
    port.postMessage({
      from: "content-script",
      to: "devtools",
      type: "pageLoaded",
      extensionConfig,
    });

    // report extensionConfig to the loaded page.
    window.dispatchEvent(new CustomEvent("extensionConfig", { detail: { extensionConfig } }));
  });
}

window.addEventListener("load", async function () {
  await initialize();

  // Run initialize again upon page navigation.
  window.addEventListener("popstate", function () {
    initialize();
  });
});
