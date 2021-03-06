// Webpack config for development
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var host = (process.env.HOST || 'localhost');
var port = parseInt(process.env.PORT) + 1 || 3001;
var HtmlWebpackPlugin = require('html-webpack-plugin');

var babelrc = fs.readFileSync('./.babelrc');
var babelrcObject = {};

try {
    babelrcObject = JSON.parse(babelrc);
} catch (err) {
    console.error('==>     ERROR: Error parsing your .babelrc.');
    console.error(err);
}

var babelrcObjectDevelopment = babelrcObject.env && babelrcObject.env.development || {};

// merge global and dev-only plugins
var combinedPlugins = babelrcObject.plugins || [];
combinedPlugins = combinedPlugins.concat(babelrcObjectDevelopment.plugins);

var babelLoaderQuery = Object.assign({}, babelrcObjectDevelopment, babelrcObject, {plugins: combinedPlugins});
delete babelLoaderQuery.env;

// make sure react-transform is enabled
babelLoaderQuery.plugins = babelLoaderQuery.plugins || [];

module.exports = {
    devtool: 'inline-source-map', // cheap-module-source-map ?
    context: __dirname,
    progress: true,
    entry: {
        app: [
            'font-awesome-webpack!./font-awesome.config.js',
            '../src/index.js'
        ]
    },
    output: {
        path: '../',
        filename: '[name].js',
        chunkFilename: '[name].js',
        // Webpack is made of lies https://github.com/webpack/css-loader/issues/232
        publicPath: 'http://localhost:8080/dev/'
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules|\.typeface\.js$/, loaders: ['babel?' + JSON.stringify(babelLoaderQuery)]},
            { test: /\.scss$/, exclude: /global\.scss$/, loader: 'style!css?sourceMap!sass?outputStyle=expanded&sourceMap' },
            { test: /\.(png|gif|jpe?g)$/, loader: 'url-loader?limit=1024' },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/font-woff' },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/font-woff' },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/octet-stream' },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file' },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=image/svg+xml' },
            { test: /\.json$/, loader: 'file' }
        ]
    },
    resolve: {
        modulesDirectories: [
            'src',
            'node_modules'
        ],
        extensions: [ '', '.json', '.js', '.jsx' ]
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new HtmlWebpackPlugin({
            template: '../src/index.html',
            inject: 'body'
        }),
    ]
};
