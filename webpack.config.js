const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  mode: "development", //"production",
  entry: {
    background: path.resolve(__dirname, ".", "src", "background.ts"),
    devtools: path.resolve(__dirname, ".", "src", "devtools.ts"),
    content_script: path.resolve(__dirname, ".", "src", "content_script.ts"),

    // ConsoleLogViewer
    inject_consoleLog: path.resolve(__dirname, ".", "src", "extensionModules", "ConsoleLogViewer", "inject_consoleLog.ts"),
    consoleLogViewerPanel: path.resolve(__dirname, ".", "src", "extensionModules", "ConsoleLogViewer", "consoleLogViewerPanel.ts"),

    // ImageEnhancement
    inject_imagePopup: path.resolve(__dirname, ".", "src", "extensionModules", "ImageEnhancement", "inject_imagePopup.ts"),

    // Popup
    popup: path.resolve(__dirname, ".", "src", "extensionModules", "PopUp", "popup.ts"),
  },
  devtool: "cheap-module-source-map",
  output: {
    path: path.join(__dirname, "./dist"),
    // Keep folder structure.
    filename: (fileData) => {
      const rawFilePath = fileData.chunk.entryModule.resource;
      const relativePath = path.relative(path.join(__dirname, "src"), rawFilePath);
      const folderPath = path.dirname(relativePath);
      return path.join(folderPath, "[name].js");
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "**/*.html", to: "[path][name][ext]", context: "src/" },
        { from: "**/assets/**/*.*", to: "[path][name][ext]", context: "src/" },
      ],
    }),
  ],
};
