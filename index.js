const stripAnsi = require('strip-ansi')
const e = require('electron')

const notify = (title, body) => {
    e.webFrame.executeJavaScript(`
    (() => {
    new Notification('${title}', {body: '${body}'})
    })()
    `)
}

let matchers
exports.decorateConfig = config => {
    return Object.assign({}, config, {
        hyperTriggersMatchers: [
            {
                matcher: /.*emit\b.*/,
                title: 'Webpack',
                body: () => new Date().toISOString()
            },
            {
                matcher: 'Compilation complete. Watching for file changes',
                title: 'Typescript',
                body: line => line.split(' - ')[0]
            }
        ]
    })
}

exports.middleware = store => next => action => {
    if (!matchers) {
        matchers = exports.decorateConfig({}).hyperTriggersMatchers
        if (e.remote.app.config.getConfig().hyperTriggersMatchers) {
            matchers = e.remote.app.config.getConfig().hyperTriggersMatchers
        }
    }
    if (action.type === 'SESSION_ADD_DATA') {
        const ansiStripped = stripAnsi(action.data)
        matchers.forEach(({matcher, title, body}) => {
            if (
                (matcher instanceof RegExp && matcher.test(ansiStripped)) ||
                (typeof matcher === 'function' && matcher(ansiStripped)) ||
                (typeof matcher === 'string' && ansiStripped.includes(matcher))
            ) {
                let bodyText
                if (typeof body === 'function') {
                    bodyText = body(ansiStripped, matcher)
                } else {
                    bodyText = body
                }
                notify(title, bodyText)
            }
        })
    }
    next(action)
}
