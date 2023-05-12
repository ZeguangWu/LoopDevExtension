import { ExtensionConfig } from "../../extensionConfig";
import { ContentScriptInitContext } from "../../ContentScriptorInitContext";

export async function contentScript(port: chrome.runtime.Port): Promise<ContentScriptInitContext> {
  let extensionConfig: ExtensionConfig;

  // Listen for messages from the loaded page, and forward them to devtools.
  window.addEventListener("consoleMessage", function (e: Event) {
    const customEvent = e as CustomEvent;
    port.postMessage({
      from: "content-script",
      to: "devtools",
      type: customEvent.type,
      level: customEvent.detail.level,
      message: customEvent.detail.message,
    });
  });

  port.onMessage.addListener((message) => {
    if (message.to !== "content-script") {
      return;
    }

    // send config to dev tool when it's open.
    switch (message.type) {
      case "devToolsOpen":
        port.postMessage({
          from: "content-script",
          to: "devtools",
          type: "pageLoaded",
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

  return { injectedScripts: [chrome.runtime.getURL("extensionModules/ConsoleLogViewer/inject_consoleLog.js")] };
}
