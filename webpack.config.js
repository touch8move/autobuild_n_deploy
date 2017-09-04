var path = require('path');
var webpack = require("webpack");
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        modules: ["node_modules"],
        descriptionFiles: ["package.json"]
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [

        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        })
    ]
};