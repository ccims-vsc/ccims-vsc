const MonacoEditorPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    configureWebpack: {
        optimization: {
            splitChunks: false
        },
        plugins: [
            new MonacoEditorPlugin({
                languages: ["markdown"],
                features: [
                    '!accessibilityHelp',
                    '!bracketMatching',
                    '!caretOperations',
                    '!clipboard',
                    '!codeAction',
                    '!codelens',
                    '!colorDetector',
                    '!comment',
                    '!contextmenu',
                    '!coreCommands',
                    '!cursorUndo',
                    '!dnd',
                    '!find',
                    '!folding',
                    '!fontZoom',
                    '!format',
                    '!gotoError',
                    '!gotoLine',
                    '!gotoSymbol',
                    '!hover',
                    '!iPadShowKeyboard',
                    '!inPlaceReplace',
                    '!inspectTokens',
                    '!linesOperations',
                    '!links',
                    '!multicursor',
                    '!parameterHints',
                    '!quickCommand',
                    '!quickOutline',
                    '!referenceSearch',
                    '!rename',
                    '!smartSelect',
                    '!snippets',
                    '!suggest',
                    '!toggleHighContrast',
                    '!toggleTabFocusMode',
                    '!transpose',
                    '!wordHighlighter',
                    '!wordOperations',
                    '!wordPartOperations'
                ]
            })
        ]
    },
    css: {
        extract: false,
    },
    filenameHashing: false,
    transpileDependencies: [/node_modules(?:\/|\\)lit-element|lit-html/],
}