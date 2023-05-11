const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  mode: "development", //"production",
  entry: {
    background: path.resolve(__dirname, "..", "src", "background.ts"),
    devtools: path.resolve(__dirname, "..", "src", "devtools.ts"),
    inject_consoleLog: path.resolve(__dirname, "..", "src", "inject_consoleLog.ts"),
    inject_imagePopup: path.resolve(__dirname, "..", "src", "inject_imagePopup.ts"),
    consoleLogViewerPanel: path.resolve(__dirname, "..", "src", "consoleLogViewerPanel.ts"),
    popup: path.resolve(__dirname, "..", "src", "popup.ts"),
    content_script: path.resolve(__dirname, "..", "src", "content_script.ts"),
  },
  devtool: "cheap-module-source-map",
  output: {
    path: path.join(__dirname, "../dist"),
    filename: "[name].js",
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
      patterns: [{ from: ".", to: ".", context: "public" }],
    }),
  ],
};
