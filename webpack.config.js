const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const fs = require('fs');
const packageJson = require('./package.json');

const isDev = process.env.NODE_ENV !== 'production';
const isWin = require('os').platform() === 'win32';

// Initialize plugins function from ykit.config.js
function initPlugins() {
  let configPlugin, systemConfigPlugin;
  try {
    configPlugin = require('./config.json').plugins;
  } catch (e) {
    configPlugin = [];
  }
  
  try {
    systemConfigPlugin = require('./common/config.js').exts;
  } catch (e) {
    systemConfigPlugin = [];
  }

  const scripts = [];
  
  if (configPlugin && Array.isArray(configPlugin) && configPlugin.length) {
    configPlugin.forEach(plugin => {
      if (plugin.client && plugin.enable) {
        let options = plugin.options ? JSON.stringify(plugin.options) : null;
        scripts.push(`"${plugin.name}" : {module: require('yapi-plugin-${plugin.name}/client.js'),options: ${options}}`);
      }
    });
  }

  if (systemConfigPlugin && Array.isArray(systemConfigPlugin)) {
    systemConfigPlugin.forEach(plugin => {
      if (plugin.client && plugin.enable) {
        let options = plugin.options ? JSON.stringify(plugin.options) : null;
        scripts.push(`"${plugin.name}" : {module: require('./exts/yapi-plugin-${plugin.name}/client.js'),options: ${options}}`);
      }
    });
  }

  const pluginModuleContent = 'module.exports = {' + scripts.join(',') + '}';
  fs.writeFileSync('client/plugin-module.js', pluginModuleContent);
}

// Run plugin initialization
initPlugins();

const assetsPluginInstance = new AssetsPlugin({
  filename: 'static/prd/assets.js',
  processOutput: function(assets) {
    return 'window.WEBPACK_ASSETS = ' + JSON.stringify(assets);
  }
});

const compressPlugin = new CompressionPlugin({
  filename: '[path][base].gz',
  algorithm: 'gzip',
  test: /\.(js|css)$/,
  threshold: 10240,
  minRatio: 0.8
});

module.exports = {
  mode: isDev ? 'development' : 'production',
  
  entry: './client/index.js',
  
  output: {
    path: path.resolve(__dirname, 'static/prd'),
    filename: isDev ? '[name].js' : '[name]@[chunkhash].js',
    publicPath: isDev ? '/' : '',
  },
  
  resolve: {
    alias: {
      client: path.resolve(__dirname, 'client'),
      common: path.resolve(__dirname, 'common'),
      exts: path.resolve(__dirname, 'exts')
    },
    extensions: ['.js', '.jsx', '.json']
  },
  
  module: {
    noParse: /node_modules\/jsondiffpatch\/public\/build\/.*js/,
    rules: [
      // JavaScript/JSX
      {
        test: /\.(js|jsx)$/,
        exclude: isWin ? /(tui-editor|node_modules\\(?!_?(yapi-plugin|json-schema-editor-visual)))/ : /(tui-editor|node_modules\/(?!_?(yapi-plugin|json-schema-editor-visual)))/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['es2015', { loose: true }],
                'react'
              ],
              plugins: [
                'transform-runtime',
                'transform-decorators-legacy',
                ['import', { libraryName: 'antd' }]
              ]
            }
          }
        ]
      },
      
      // ESLint
      {
        test: /\.(js|jsx)$/,
        exclude: /tui-editor|node_modules|google-diff.js/,
        enforce: 'pre',
        use: ['eslint-loader']
      },
      
      // Less
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true
            }
          }
        ]
      },
      
      // Sass/SCSS  
      {
        test: /\.(sass|scss)$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      
      // CSS
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      
      // Images and fonts
      {
        test: /\.(gif|jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: '[path][name].[ext]?[sha256:hash:base64:8]'
          }
        }]
      },
      
      // JSON
      {
        test: /\.json$/,
        use: ['json-loader']
      }
    ]
  },
  
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      'process.env.version': JSON.stringify(packageJson.version),
      'process.env.versionNotify': JSON.stringify(true)
    })
  ].concat(isDev ? [] : [
    assetsPluginInstance,
    compressPlugin,
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /^\.\/(zh-cn|en-gb)$/)
  ]),
  
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  
  devtool: isDev ? 'cheap-module-eval-source-map' : 'source-map',
  
  devServer: {
    contentBase: path.join(__dirname, 'static'),
    hot: true,
    overlay: false,
    historyApiFallback: true,
    port: 4000,
    host: 'localhost'
  }
};