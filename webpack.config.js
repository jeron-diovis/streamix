var sysPath = require("path");
var root = __dirname;
var srcRoot = sysPath.join(root, "src");

module.exports = {
  context: srcRoot,

  entry: "index.js",

  output: {
    path: sysPath.join(root, "dist"),
    filename: "index.js"
  },

  resolve: {
    root: srcRoot
  },

  module: {
    loaders: [
      {
        test: /\.js$/i,
        include: srcRoot,
        loader: "babel"
      }
    ]
  }
};