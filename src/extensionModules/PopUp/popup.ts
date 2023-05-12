import { ExtensionConfig, getExtensionConfig, updateConfigCache } from "../../extensionConfig";

// Listen for messages from background script
const port = chrome.runtime.connect({
  name: "popup",
});
port.onMessage.addListener((message) => {
  if (message.to !== "popup") {
    return;
  }
});

function readExtensionConfig(): ExtensionConfig {
  const extensionConfig: ExtensionConfig = {
    enabled: !!document.querySelector<HTMLInputElement>("#toggleExtensionEnabled")?.checked,
    imagePreviewPopup: {
      enabled: !!document.querySelector<HTMLInputElement>("#toggleImagePreviewPopupEnabled")?.checked,
    },
    consoleLogViewer: {
      enabled: !!document.querySelector<HTMLInputElement>("#toggleConsoleLogViewerEnabled")?.checked,
      bypassConsoleLog: !!document.querySelector<HTMLInputElement>("#toggleBypassConsoleLog")?.checked,
    },
  };

  return extensionConfig;
}

async function renderExtensionConfig() {
  let extensionConfig = await getExtensionConfig();

  // Set the UI based on the extension config.
  document.querySelector<HTMLInputElement>("#toggleExtensionEnabled")!.checked = extensionConfig.enabled;
  document.querySelector<HTMLInputElement>("#toggleImagePreviewPopupEnabled")!.checked = extensionConfig.imagePreviewPopup.enabled;
  document.querySelector<HTMLInputElement>("#toggleConsoleLogViewerEnabled")!.checked = extensionConfig.consoleLogViewer.enabled;
  document.querySelector<HTMLInputElement>("#toggleBypassConsoleLog")!.checked = extensionConfig.consoleLogViewer.bypassConsoleLog;
}

window.addEventListener("load", async () => {
  await renderExtensionConfig();

  // Listen to change event for all controls
  [...document.querySelectorAll<HTMLInputElement>("input")].forEach((element) => {
    element.addEventListener("change", function () {
      const newConfig = readExtensionConfig();
      port.postMessage({
        from: "popup",
        to: "devtools",
        type: "extensionConfig",
        extensionConfig: newConfig,
      });
      port.postMessage({
        from: "popup",
        to: "content-script",
        type: "extensionConfig",
        extensionConfig: newConfig,
      });

      updateConfigCache(readExtensionConfig());
    });
  });

  document.querySelector<HTMLInputElement>("#toggleExtensionEnabled")?.addEventListener("change", function (ev) {
    const inputElement = ev.target as HTMLInputElement;
    if (inputElement.checked) {
      document.querySelector("#configGroups")?.classList.remove("disabled");
    } else {
      document.querySelector("#configGroups")?.classList.add("disabled");
    }
  });

  document.querySelector<HTMLInputElement>("#toggleConsoleLogViewerEnabled")?.addEventListener("change", function (ev) {
    const inputElement = ev.target as HTMLInputElement;
    if (inputElement.checked) {
      document.querySelector("#consoleLogConfigGroups")?.classList.remove("disabled");
    } else {
      document.querySelector("#consoleLogConfigGroups")?.classList.add("disabled");
    }
  });
});
