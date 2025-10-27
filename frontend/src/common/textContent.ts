export const textContent = `
function EventsOnMultiple(eventName, callback, maxCallbacks) {
    return window.runtime.EventsOnMultiple(eventName, callback, maxCallbacks);
}

function EventsOn(eventName, callback) {
    return EventsOnMultiple(eventName, callback, -1);
}

function EventsEmit(eventName) {
    let args = [eventName].slice.call(arguments);
    return window.runtime.EventsEmit.apply(null, args);
}

const select = {
    postMessage: 'webview-post-message',
    onMessage: 'webview-on-message',
    cssVariables: 'webview-css-variables',
    onCSSVariables: 'webview-on-css-variables',
    getExpansions: 'webview-get-expansions',
    onExpansionsMessage: 'webview-on-expansions-message'
}

const createOn = (callback, eventName, name) => {
    const handler = (data) => {
        if (data.name === name) {
            callback && callback(data.value)
        }
    }

    EventsOn(eventName, handler)

    return () => {
        // EventsOff(eventName, handler)
    }
}

const createValue = async (data, name, typing) => {
    await EventsEmit('expansions-post-message', {
        type: typing,
        data: {
            name: name,
            value: data
        }
    })
}

export const appDesktopHideAPI = {
    create: (name) => {
        EventsEmit('webview-hide-message-create', {
            _name: name
        })

        return {
            send: (data) => {
                EventsEmit('webview-hide-message', {
                    _name: name,
                    type: data?.type || '',
                    data: data?.data || {}
                })
            },
            on: (callback) => {
                EventsOn('webview-hide-message', (data) => {
                    if (data._name === name && callback) {
                        callback(data)
                    }
                })
            }
        }
    },
    themeVariables: (name) => createValue({}, name, select.cssVariables),
    themeOn: (name, callback) => createOn(callback, select.onCSSVariables, name)
}

export const appDesktopAPI = {
    create: (name) => {
        return {
            postMessage: (data) => createValue(data, name, select.postMessage),
            onMessage: (callback) => createOn(callback, select.onMessage, name),
            expansion: {
                getList: () => createValue({}, name, select.getExpansions),
                on: (callback) => createOn(callback, select.onExpansionsMessage, name)
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.appDesktopHideAPI = appDesktopHideAPI
    window.appDesktopAPI = appDesktopAPI
}`