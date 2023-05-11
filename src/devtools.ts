import { RowData } from "./HTMLTable";
import { ExtensionConfig, getExtensionConfig } from "./extensionConfig";
import { ConsoleLogViewerPanelWindow } from "./consoleLogViewerPanel";
import { RuntimeMessage } from "./message";

let consoleLogViewerPanel: chrome.devtools.panels.ExtensionPanel;
let consoleLogViewerPanelWindow: ConsoleLogViewerPanelWindow;
let consoleLogProcessingTaskId: NodeJS.Timeout | undefined;

let pendingRowData: RowData[] = [];

let extensionConfig: ExtensionConfig;

// Listen for messages from background script
const port = chrome.runtime.connect({
  name: `devtools:${chrome.devtools.inspectedWindow.tabId}`,
});
port.onMessage.addListener((message: RuntimeMessage) => {
  if (message.to !== "devtools") {
    return;
  }

  switch (message.type) {
    case "extensionConfig":
      {
        extensionConfig = message.extensionConfig as ExtensionConfig;
        applyExtensionConfig(extensionConfig);
      }
      break;
    case "consoleMessage":
      if (extensionConfig.consoleLogViewer.enabled && consoleLogViewerPanelWindow && consoleLogViewerPanelWindow.shouldCapture) {
        const parseResult = tryParseJSON(message.message);
        if (parseResult.result) {
          const rowData = prepTelemetryDataForOutput(parseResult.result);
          pendingRowData.push({
            level: message.level,
            data: rowData
          });
        }

        startConsoleLogProcessingTask();
      }
      break;
    default:
      break;
  }
});

function sendMessage(message: RuntimeMessage): void {
  port.postMessage(message);
}

sendMessage({
  from: "devtools",
  to: "content-script",
  type: "devToolsOpen",
});

async function initialize() {
  extensionConfig = await getExtensionConfig();
  applyExtensionConfig(extensionConfig);
}

function applyExtensionConfig(extensionConfig: ExtensionConfig) {
  if (!extensionConfig.enabled || !extensionConfig.consoleLogViewer.enabled) {
    // console log viewer is disabled.
    stopConsoleLogProcessingTask();
    consoleLogViewerPanelWindow && consoleLogViewerPanelWindow.disablePanel();
  } else {
    enableConsoleLogViewerPanel();
  }
}

function createConsoleLogViewerPanel() {
  chrome.devtools.panels.create("Log Viewer", "icon.png", "consoleLogViewerPanel.html", (panel) => {
    consoleLogViewerPanel = panel;

    panel.onShown.addListener((extPanelWindow) => {
      consoleLogViewerPanelWindow = extPanelWindow as ConsoleLogViewerPanelWindow;
    });
  });
}

async function startConsoleLogProcessingTask() {
  if (!consoleLogProcessingTaskId) {
    consoleLogProcessingTaskId = setTimeout(() => {
      consoleMessageTaskBeat();
    }, 1000);
  }
}

async function consoleMessageTaskBeat() {
  consoleLogProcessingTaskId = undefined;

  await processPendingList();

  // set next task beat.
  startConsoleLogProcessingTask();
}

async function processPendingList() {
  if (!consoleLogViewerPanelWindow) {
    return;
  }

  consoleLogViewerPanelWindow.addData(pendingRowData);
  pendingRowData = [];
}

function stopConsoleLogProcessingTask() {
  consoleLogProcessingTaskId !== undefined && clearTimeout(consoleLogProcessingTaskId);
  consoleLogProcessingTaskId = undefined;
}

function enableConsoleLogViewerPanel() {
  if (!consoleLogViewerPanel || !consoleLogViewerPanelWindow) {
    createConsoleLogViewerPanel();
  } else {
    consoleLogViewerPanelWindow.document.querySelector(".modalDialog")?.remove();
  }

  // Inject code to set bypass flag in the loaded page.
  chrome.devtools.inspectedWindow.eval(`window.bypassConsoleLog = ${extensionConfig.consoleLogViewer.bypassConsoleLog}`);

  // start processing.
  startConsoleLogProcessingTask();
}

function tryParseJSON(jsonString: string) {
  let result = null;
  let error = null;

  try {
    result = JSON.parse(jsonString);
  } catch (e) {
    error = e;
  }

  return {
    result,
    error,
  };
}

function prepTelemetryDataForOutput(data: { props?: Object }) {
  data = { ...data, ...data.props };
  delete data.props;

  return data;
}

initialize();
