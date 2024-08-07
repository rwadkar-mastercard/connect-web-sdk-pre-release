const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'connect-web-sdk.js',
    path: path.resolve(__dirname, 'dist/umd'),
    library: 'ConnectWebSDK',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
