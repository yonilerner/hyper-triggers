const stripAnsi = require('strip-ansi')
const e = require('electron')

const notify = (title, body) => {
    e.webFrame.executeJavaScript(`
    (() => {
    new Notification('${title}', {body: '${body}'})
    })()
    `)
}

const matchers = [
    {
        regex: /.*emit\b.*/,
        title: 'Webpack',
        body: () => new Date().toISOString()
    },
    {
        regex: /.*Compilation complete. Watching for file changes*/,
        title: 'Typescript',
        body: line => line.split(' - ')[0]
    }
]

exports.middleware = store => next => action => {
    if (action.type === 'SESSION_ADD_DATA') {
        const ansiStripped = stripAnsi(action.data)
        matchers.forEach(({regex, title, body}) => {
            if (regex.test(ansiStripped)) {
                notify(title, body(ansiStripped))
            }
        })
    }
    next(action)
}
