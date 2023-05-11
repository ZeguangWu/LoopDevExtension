import $ from "jquery";
import { ExtensionConfig, getExtensionConfig, updateConfigCache } from "./extensionConfig";
import { RuntimeMessage } from "./message";

// Listen for messages from background script
const port = chrome.runtime.connect({
  name: "popup",
});
port.onMessage.addListener((message) => {
  if (message.to !== "popup") {
    return;
  }
});

function sendMessage(message: RuntimeMessage): void {
  port.postMessage(message);
}

function readExtensionConfig(): ExtensionConfig {
  const extensionConfig: ExtensionConfig = {
    enabled: $("#toggleExtensionEnabled").prop("checked"),
    imagePreviewPopup: {
      enabled: $("#toggleImagePreviewPopupEnabled").prop("checked"),
    },
    consoleLogViewer: {
      enabled: $("#toggleConsoleLogViewerEnabled").prop("checked"),
      bypassConsoleLog: $("#toggleBypassConsoleLog").prop("checked"),
    },
  };

  return extensionConfig;
}

async function renderExtensionConfig() {
  let extensionConfig = await getExtensionConfig();

  // Set the UI based on the extension config.
  $("#toggleExtensionEnabled").prop("checked", extensionConfig.enabled);
  $("#toggleImagePreviewPopupEnabled").prop("checked", extensionConfig.imagePreviewPopup.enabled);
  $("#toggleConsoleLogViewerEnabled").prop("checked", extensionConfig.consoleLogViewer.enabled);
  $("#toggleBypassConsoleLog").prop("checked", extensionConfig.consoleLogViewer.bypassConsoleLog);
}

$(async () => {
  await renderExtensionConfig();

  // Listen to change event for all controls
  $("input").each(function (index: number, element: HTMLElement) {
    $(element).on("change", function () {
      const newConfig = readExtensionConfig();
      sendMessage({
        from: "popup",
        to: "devtools",
        type: "extensionConfig",
        extensionConfig: newConfig,
      });
      sendMessage({
        from: "popup",
        to: "content-script",
        type: "extensionConfig",
        extensionConfig: newConfig,
      });

      updateConfigCache(readExtensionConfig());
    });
  });

  $("#toggleExtensionEnabled").on("change", function () {
    var isChecked = $(this).prop("checked");
    if (isChecked) {
      $("#configGroups").removeClass("disabled");
    } else {
      $("#configGroups").addClass("disabled");
    }
  });

  $("#toggleConsoleLogViewerEnabled").on("change", function () {
    var isChecked = $(this).prop("checked");
    if (isChecked) {
      $("#consoleLogConfigGroups").removeClass("disabled");
    } else {
      $("#consoleLogConfigGroups").addClass("disabled");
    }
  });
});
