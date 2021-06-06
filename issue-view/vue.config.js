module.exports = {
    configureWebpack: {
        optimization: {
            splitChunks: false
        }
    },
    css: {
        extract: false,
    },
    filenameHashing: false,
    transpileDependencies: [/node_modules(?:\/|\\)lit-element|lit-html/],
}