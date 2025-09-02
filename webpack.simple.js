const path = require('path');

module.exports = {
  mode: 'development',
  entry: './client/index.js',
  output: {
    path: path.resolve(__dirname, 'static/prd'),
    filename: 'index.js',
    publicPath: '/prd/'
  },
  
  resolve: {
    alias: {
      'client': path.resolve(__dirname, 'client'),
      'common': path.resolve(__dirname, 'common'),
      'exts': path.resolve(__dirname, 'exts')
    },
    extensions: ['.js', '.jsx', '.json']
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { loose: true, modules: 'commonjs' }],
              '@babel/preset-react'
            ],
            plugins: []
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.scss$/,
        use: ['ignore-loader']  // 暂时忽略SCSS文件
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'static'),
    },
    port: 4000,
    hot: true,
    proxy: [{
      context: ['/api'],
      target: 'http://127.0.0.1:3000',
      changeOrigin: true
    }]
  },
  
  devtool: 'source-map'
};