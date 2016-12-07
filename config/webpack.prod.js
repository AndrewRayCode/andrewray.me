// Webpack config for development
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var host = (process.env.HOST || 'localhost');
var port = parseInt(process.env.PORT) + 1 || 3001;
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

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
    context: __dirname,
    progress: true,
    entry: {
        'app-main': [
            'font-awesome-webpack',
            '../src/index.js'
        ]
    },
    output: {
        path: 'build',
        filename: '[name].js',
        chunkFilename: '[name].js',
        publicPath: 'https://andrewray.s3-us-west-2.amazonaws.com/',
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules|\.typeface\.js$/, loaders: ['babel?' + JSON.stringify(babelLoaderQuery)]},
            { test: /\.scss$/, exclude: /global\.scss$/, loader: ExtractTextPlugin.extract('style', 'css?sourceMap&sourceMap!sass?outputStyle=expanded&sourceMap' ) },
            { test: /\.(png|gif|jpe?g)$/, loader: 'url-loader?limit=1024' },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
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
        new ExtractTextPlugin('[name]-[chunkhash].css', {allChunks: true}),
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new HtmlWebpackPlugin({
            template: '../src/index.html',
            inject: 'body'
        }),
    ]
};
