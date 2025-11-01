import { EventsEmit, EventsOn, EventsOff } from '@wailsjs/runtime/runtime';

const eventName = 'webview-hide-message';
const obEventName = 'webview-on-hide-message';

class appDesktopHideAPI {
    name: string
    constructor(name: string) {
        this.name = name
    }

    static create(name: string) {
        return new appDesktopHideAPI(name)
    }

    send(data: {
        type?: string;
        data?: any;
    }) {
        // 发送任意消息
        EventsEmit(eventName, {
            _name: this.name,
            type: data?.type || '',
            data: data?.data || {}
        })
    }

    on(callback: (data: any) => void) {
        // 订阅消息
        EventsOn(obEventName, (data) => {
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

    themeOn(callback: (data: any) => void) {
        this.on((data) => {
            if (data._name === this.name && data.type === this.#themeVariablesEventName) {
                callback(data.value)
            }
        })
    }
}

class appDesktopAPI extends appDesktopHideAPI {
    static create(name: string) {
        return new appDesktopAPI(name)
    }
    #eventPostName = 'post-message';
    #eventOnPostName = 'on-post-message';
    postMessage(data: any) {
        return this.send({
            type: this.#eventPostName,
            data: {
                name: this.name,
                value: data
            }
        })
    }
    onMessage(callback: (data: any) => void) {
        return this.on((data) => {
            if (callback && data.type === this.#eventOnPostName) {
                callback(data.data)
            }
        })
    }
    #expansionEventName = 'get-expansions'
    #expansionOnEventName = 'on-get-expansions'
    expansion = {
        getList: () => {
            return this.send({
                type: this.#expansionEventName,
                data: {
                    name: this.name,
                }
            })
        },
        on: (callback: (data: any) => void) => {
            return this.on((data) => {
                if (callback && data.type === this.#expansionOnEventName) {
                    callback(data.data)
                }
            })
        }
    }
}

// 声明 window.runtime 类型
declare global {
    interface Window {
        appDesktopHideAPI: typeof appDesktopHideAPI;
        appDesktopAPI: typeof appDesktopAPI;
    }
}


window.appDesktopHideAPI = appDesktopHideAPI
window.appDesktopAPI = appDesktopAPI