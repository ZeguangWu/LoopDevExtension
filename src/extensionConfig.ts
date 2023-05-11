export const EXTENSION_CONFIG_LOCAL_STORAGE_KEY = "loop_extension_extensionConfig";

export interface ExtensionConfig {
  enabled: boolean;
  imagePreviewPopup: {
    enabled: boolean;
  };
  consoleLogViewer: {
    enabled: boolean;
    bypassConsoleLog: boolean;
  };
}

export const DefaultExtensionConfig = {
  enabled: true,
  imagePreviewPopup: {
    enabled: true,
  },
  consoleLogViewer: {
    enabled: true,
    bypassConsoleLog: true,
  },
};

export async function updateConfigCache(config: ExtensionConfig) {
  // Save into localStorage.
  await chrome.storage.local.set({ [EXTENSION_CONFIG_LOCAL_STORAGE_KEY]: config });
}

export async function getExtensionConfig(): Promise<ExtensionConfig> {
  let extensionConfig;

  const cachedExtensionConfig = await chrome.storage.local.get([EXTENSION_CONFIG_LOCAL_STORAGE_KEY]);
  if (cachedExtensionConfig) {
    extensionConfig = cachedExtensionConfig[EXTENSION_CONFIG_LOCAL_STORAGE_KEY] as ExtensionConfig;
  }

  return extensionConfig || DefaultExtensionConfig;
}
