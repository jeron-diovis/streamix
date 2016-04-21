var sysPath = require("path");
var root = __dirname;
var srcRoot = sysPath.join(root, "src");
var testsRoot = sysPath.join(root, "test");

module.exports = function (config) {
  config.set({
    singleRun: true,
    browsers: [ "Chrome" ],
    frameworks: [ "mocha", "chai-sinon" ],
    reporters: [ "mocha" ],
    files: [
      "webpack.config.test.js"
    ],
    preprocessors: {
      "webpack.config.test.js": [ "webpack", "sourcemap" ]
    },
    webpack: {
      devtool: "inline-source-map",
      resolve: {
        root: srcRoot
      },
      module: {
        loaders: [
          {
            test: /\.js$/,
            include: [
              srcRoot,
              testsRoot
            ],
            loader: "babel"
          }
        ]
      }
    },
    webpackServer: {
      noInfo: true
    }
  });
};