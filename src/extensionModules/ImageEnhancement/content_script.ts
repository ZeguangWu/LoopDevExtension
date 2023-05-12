import { ExtensionConfig } from "../../extensionConfig";

export async function contentScript(port: chrome.runtime.Port) {
  let extensionConfig: ExtensionConfig;

  port.onMessage.addListener((message) => {
    if (message.to !== "content-script") {
      return;
    }
    
    switch (message.type) {
      case "extensionConfig":
        // report to the loaded page upon config change.
        extensionConfig = message.extensionConfig;
        window.dispatchEvent(new CustomEvent("extensionConfig", { detail: { extensionConfig } }));
        break;
      default:
        break;
    }
  });

  return {
    injectedScripts: [chrome.runtime.getURL("extensionModules/ImageEnhancement/inject_imagePopup.js")],
  };
}
