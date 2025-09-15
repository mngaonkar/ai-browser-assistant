const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background-simple': './src/background-simple.js',
    content: './src/content.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist-simple'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest-simple.json', to: 'manifest.json' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'content.css', to: 'content.css' },
        { from: 'test-init.html', to: 'test-init.html' },
        { from: 'test.html', to: 'test.html' }
      ]
    })
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false
    }
  }
};
