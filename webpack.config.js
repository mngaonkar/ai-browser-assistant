const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'content.css', to: 'content.css' },
        { from: 'src/mermaid-render.js', to: 'mermaid-render.js' },
        { from: 'test.html', to: 'test.html' },
        { from: 'test-langgraph.html', to: 'test-langgraph.html' },
        { from: 'test-background.html', to: 'test-background.html' },
        { from: 'test-init.html', to: 'test-init.html' },
        { from: 'debug.html', to: 'debug.html' },
        { from: 'README.md', to: 'README.md' }
      ]
    }),
    // Handle node: URI scheme
    new webpack.NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      }
    )
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "url": false,
      "buffer": false,
      "process": false,
      "os": false,
      "net": false,
      "tls": false,
      "child_process": false,
      "async_hooks": false,
      "events": false,
      "http": false,
      "https": false,
      "zlib": false,
      "querystring": false,
      "readline": false,
      "repl": false,
      "timers": false,
      "tty": false,
      "vm": false,
      "worker_threads": false
    }
  },
  optimization: {
    splitChunks: {
      chunks: (chunk) => {
        // Don't split the background script - bundle everything together
        return chunk.name !== 'background';
      },
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: (chunk) => chunk.name !== 'background'
        }
      }
    }
  }
};
