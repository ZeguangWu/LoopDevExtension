export interface ContentScriptInitContext {
  injectedScripts: string[];
  registerRuntimeMessagePort: (port: chrome.runtime.Port) => void;
}
