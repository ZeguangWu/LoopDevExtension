export interface DevToolsInitContext {
  registerRuntimeMessagePort: (port: chrome.runtime.Port) => void;
}
