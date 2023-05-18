import { ExtensionConfig } from "../../extensionConfig";
import { ContentScriptInitContext } from "../../contracts/contentScriptInitContext";
import { RuntimeMessage } from "../../message";

export async function contentScript(): Promise<ContentScriptInitContext> {
  let extensionConfig: ExtensionConfig;
  let runtimePort: chrome.runtime.Port;

  // Listen for messages from the loaded page, and forward them to devtools.
  window.addEventListener("consoleMessage", function (e: Event) {
    const customEvent = e as CustomEvent;
    if (runtimePort) {
      runtimePort.postMessage({
        from: "content-script",
        to: "devtools",
        type: customEvent.type,
        level: customEvent.detail.level,
        message: customEvent.detail.message,
      });
    }
  });

  const registerRuntimeMessagePort = (port: chrome.runtime.Port) => {
    runtimePort = port;
    runtimePort.onMessage.addListener((message: RuntimeMessage) => {
      if (message.to !== "content-script") {
        return;
      }

      // send config to dev tool when it's open.
      switch (message.type) {
        case "extensionConfig":
          // report extension config to the loaded page.
          extensionConfig = message.extensionConfig;
          window.dispatchEvent(new CustomEvent("extensionConfig", { detail: { extensionConfig } }));
          break;
        default:
          break;
      }
    });
  };

  return {
    injectedScripts: [chrome.runtime.getURL("extensionModules/ConsoleLogViewer/inject_consoleLog.js")],
    registerRuntimeMessagePort,
  };
}
