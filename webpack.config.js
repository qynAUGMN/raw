var path = require('path');

var config = {
  context: __dirname,
  entry: {
    app: './js/app.js'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.css$/,
      loader: "style!css-loader"
    }, {
      test: /\.scss$/,
      loader: "style!css!sass?outputStyle=expanded"
    }, {
      test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$/,
      loader: "file"
    }, {
      test: /\.html$/,
      loader: "ngtemplate?relativeTo=" + path.join(__dirname, 'app/') + "!raw"
    }]
  },
  // Let webpack know where the module folders are for bower and node_modules
  // This lets you write things like - require('bower/<plugin>') anywhere in your code base
  resolve: {
    // descriptionFiles: ["bower.json"],
    // alias: {
      // jQuery: path.resolve(__dirname, "bower_components/jquery/dist/jquery.min.js")
    // }
  },
  plugins: [
  ]
};

module.exports = config;
