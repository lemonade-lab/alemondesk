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
    // 发送消息
    postMessage: 'webview-post-message',
    // 接收消息
    onMessage: 'webview-on-message',
    // 主题变量
    cssVariables: 'webview-css-variables',
    // 主题变化
    onCSSVariables: 'webview-on-css-variables',
    // 得到扩展列表
    getExpansions: 'webview-get-expansions',
    // 扩展消息
    onExpansionsMessage: 'webview-on-expansions-message'
}

const createOn = (callback, eventName, name) => {
    const handler = (data) => {
        if (data.name === name) {
            callback && callback(data.value)
        }
    }
    EventsOn(eventName, handler)
}

const postMessage = async (data, name, typing) => {
    await EventsEmit('expansions-post-message', {
        type: typing,
        data: {
            name: name,
            value: data
        }
    })
}

const appDesktopHideAPI = {
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
                    console.log('on-webview-hide-message', data)
                    if (data._name === name && callback) {
                        callback(data)
                    }
                })
            }
        }
    },
    themeVariables: (name) => postMessage({}, name, select.cssVariables),
    themeOn: (name, callback) => createOn(callback, select.onCSSVariables, name)
}

const appDesktopAPI = {
    create: (name) => {
        return {
            postMessage: (data) => postMessage(data, name, select.postMessage),
            onMessage: (callback) => createOn(callback, select.onMessage, name),
            expansion: {
                getList: () => postMessage({}, name, select.getExpansions),
                on: (callback) => createOn(callback, select.onExpansionsMessage, name)
            }
        }
    }
}
window.appDesktopHideAPI = appDesktopHideAPI
window.appDesktopAPI = appDesktopAPI


// const expansionsName = '@alemonjs/process'

// // 创建隐藏桌面API
// const main = window.appDesktopHideAPI?.create(expansionsName)

// console.log('expansionsName', expansionsName)
// console.log('main', main)

// // 监听隐藏消息
// main.on(data => {
//     if (data.type == 'css-variables') {
//         const cssVariables = data.data
//         try {
//             Object.keys(cssVariables).forEach(key => {
//                 document.documentElement.style.setProperty(`--${key}`, cssVariables[key])
//             })
//         } catch (e) {
//             console.error(e)
//         }

//     } else if (data.type == 'theme-mode') {
//         const mode = data.data
//         if (mode === 'dark') {
//             document.documentElement.classList.add('dark')
//         } else {
//             document.documentElement.classList.remove('dark')
//         }
//     }
// })

// // 获取 css 变量

// main.send({
//     type: 'css-variables'
// })

// // 获得 css 主题

// main.send({
//     type: 'theme-mode'
// })


// // 创建桌面API 
// window.createDesktopAPI = () => window.appDesktopAPI.create(expansionsName)