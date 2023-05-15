import { ExtensionConfig, getExtensionConfig } from "./extensionConfig";
import { ContentScriptInitContext } from "./contracts/contentScriptInitContext";

import * as ConsoleLogViewer from "./extensionModules/ConsoleLogViewer/content_script";
import * as ImageEnhancement from "./extensionModules/ImageEnhancement/content_script";

let extensionConfig: ExtensionConfig;
const scriptInjectionPromises: Promise<void>[] = [];
const moduleContexts: ContentScriptInitContext[] = [];

let port: chrome.runtime.Port;
function connect() {
  port = chrome.runtime.connect({
    name: "content-script",
  });

  // auto reconnect.
  // According to https://developer.chrome.com/docs/extensions/whatsnew/#m110-sw-idle,
  // An extension service worker will be shut down after either thirty seconds of inactivity. (╬▔皿▔)╯
  port.onDisconnect.addListener(() => {
    console.log("content-script port disconnected. reconnecting...");
    connect();
    console.log("content-script port reconnected.");
  });

  // invoke port change handlers in each module.
  moduleContexts.forEach((context) => {
    context.registerRuntimeMessagePort(port);
  });
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

function initializeModule(context: ContentScriptInitContext) {
  moduleContexts.push(context);

  context.injectedScripts.forEach((script) => {
    scriptInjectionPromises.push(injectScriptTag(script));
  });
}

async function initialize() {
  initializeModule(await ConsoleLogViewer.contentScript());
  initializeModule(await ImageEnhancement.contentScript());

  const extensionConfigPromise = getExtensionConfig().then((config) => (extensionConfig = config));
  await Promise.allSettled([...scriptInjectionPromises, extensionConfigPromise]);

  connect();

  // report extension config to runtime upon new page load.
  port.postMessage({
    from: "content-script",
    to: "devtools",
    type: "pageLoaded",
    extensionConfig,
  });

  // report extensionConfig to the loaded page.
  window.dispatchEvent(new CustomEvent("extensionConfig", { detail: { extensionConfig } }));
}

window.addEventListener("load", async function () {
  await initialize();

  // Run initialize again upon page navigation.
  window.addEventListener("popstate", function () {
    initialize();
  });
});
