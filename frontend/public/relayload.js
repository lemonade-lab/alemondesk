function EventsOnMultiple(eventName, callback, maxCallbacks) {
    return window.runtime.EventsOnMultiple(eventName, callback, maxCallbacks);
}

function EventsOff(eventName, ...additionalEventNames) {
    return window.runtime.EventsOff(eventName, ...additionalEventNames);
}

function EventsOn(eventName, callback) {
    return EventsOnMultiple(eventName, callback, -1);
}

function EventsEmit(eventName) {
    let args = [eventName].slice.call(arguments);
    return window.runtime.EventsEmit.apply(null, args);
}

const eventName = 'webview-hide-message';
const obEventName = 'webview-on-hide-message';

const createOn = (_, callback, name) => {
    const handler = (data) => {
        // 属于自己的消息才处理
        if (data.name === name) {
            callback && callback(data.value)
        }
    }
    EventsOn(eventName, handler)
}

const createEmit = async (data, name, typing) => {
    return EventsEmit(eventName, {
        _name: name,
        type: typing,
        data: data
    })
}

class appDesktopHideAPI {

    constructor(name) {
        this.name = name
    }

    static create(name) {
        return new appDesktopHideAPI(name)
    }

    send(data) {
        // 发送任意消息
        EventsEmit(eventName, {
            _name: this.name,
            type: data?.type || '',
            data: data?.data || {}
        })
    }

    on(callback) {
        // 订阅消息
        EventsOn(obEventName, (data) => {
            console.log('[WebView] 收到隐藏桌面消息', data)
            if (data._name === this.name && callback) {
                callback(data)
            }
        })
    }

    // 卸载callback
    off() {
        EventsOff(eventName)
    }

    #themeVariablesEventName = 'webview-theme-variables'

    themeVariables() {
        this.send({
            type: this.#themeVariablesEventName
        })
    }

    themeOn(callback) {
        this.on((data) => {
            if (data._name === this.name && data.type === this.#themeVariablesEventName) {
                callback(data.value)
            }
        })
    }
}

class appDesktopAPI extends appDesktopHideAPI {
    static create(name) {
        return new appDesktopAPI(name)
    }

    // 兼容性方法
    postMessage(data) {
        return this.send({
            type: data.type,
            data: data.data
        })
    }

    onMessage(callback) {
        return this.on((data) => {
            if (callback) {
                callback(data.data)
            }
        })
    }

    // 扩展功能相关
    #expansionEventName = 'webview-get-expansions'

    expansion = {
        getList: () => {
            return this.send({
                type: this.#expansionEventName
            })
        },
        on: (callback) => {
            return this.on((data) => {
                if (data.type === this.#expansionEventName && callback) {
                    callback(data.data)
                }
            })
        }
    }
}

window.appDesktopHideAPI = appDesktopHideAPI
window.appDesktopAPI = appDesktopAPI