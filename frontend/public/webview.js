class __Desk_WebView {
    constructor() {
        this.callbackId = 1;
        this.callbacks = new Map();
    }

    send(data) {
        try {
            window.parent.postMessage(data, '*');
        } catch (error) {
            console.error('WebView 发送消息错误:', error);
        }
    }

    on(callback) {
        window.addEventListener('message', (event) => {
            if (event.data) {
                callback(event.data);
            }
        });
    }

    // 处理回调响应
    handleResponse(message) {
        if (message.callbackId && this.callbacks.has(message.callbackId)) {
            const callback = this.callbacks.get(message.callbackId);
            if (message.error) {
                callback.reject(new Error(message.error));
            } else {
                callback.resolve(message.result);
            }
            this.callbacks.delete(message.callbackId);
        }
    }
}

const observeKeys = {
    EventsOnMultiple: true
}
// 收集订阅
const runtimeEventListeners = new Map();

// 初始化
window.__alemondesk_webview = new __Desk_WebView();

// 代理 runtime 对象
window.runtime = new Proxy({}, {
    get(target, prop) {
        return (...args) => {
            // 处理特殊的订阅机制
            if (observeKeys[prop]) {
                const eventName = args[0];
                const callback = args[1];
                if (!runtimeEventListeners.has(eventName)) {
                    runtimeEventListeners.set(eventName, []);
                }
                runtimeEventListeners.get(eventName).push(callback);
                return new Promise((resolve, reject) => {
                    const callbackId = window.__alemondesk_webview.callbackId++;
                    window.__alemondesk_webview.callbacks.set(callbackId, {resolve, reject});
                    window.__alemondesk_webview.send({
                        global: 'runtime',
                        type: prop,
                        // 只传第一个参数 eventName，回调函数不传
                        args: [eventName],
                        callbackId: callbackId
                    });
                });
            }
            return new Promise((resolve, reject) => {
                const callbackId = window.__alemondesk_webview.callbackId++;
                window.__alemondesk_webview.callbacks.set(callbackId, {resolve, reject});
                window.__alemondesk_webview.send({
                    global: 'runtime',
                    type: prop,
                    args: args,
                    callbackId: callbackId
                });
            });
        };
    }
});

// 代理 go 对象
// window.go = new Proxy({}, {
//     get(target, prop) {
//         return (...args) => {
//             return new Promise((resolve, reject) => {
//                 const callbackId = window.__alemondesk_webview.callbackId++;
//                 window.__alemondesk_webview.callbacks.set(callbackId, {resolve, reject});
//                 window.__alemondesk_webview.send({
//                     global: 'go',
//                     type: prop,
//                     args: args,
//                     callbackId: callbackId
//                 });
//             });
//         };
//     }
// });

// 处理来自父窗口的响应
window.__alemondesk_webview.on((message) => {
    if (message.callbackId) {
        window.__alemondesk_webview.handleResponse(message);
    }
});

window.__alemondesk_webview.on(async (data) => {
    try {
        // 同样双向执行
        if (data.global === 'runtime') {
            console.log(`[WebView] 收到 runtime 事件 ${data.type} 消息`, data);
            // 先检查是否是订阅的事件
            if (runtimeEventListeners.has(data.type)) {
                 const callbacks = runtimeEventListeners.get(data.type);
                callbacks.forEach(callback => callback(...data.args));
                return;
            }
            else {
                // 不是订阅的。调用 runtime 方法
                const runtimeProp = window.runtime[data.type];
                if (typeof runtimeProp === 'function') {
                    const result = await runtimeProp(...data.args);
                    // 发送回调结果
                    window.__alemondesk_webview.send({
                        callbackId: data.callbackId,
                        result: result
                    });
                    return;
                }
            }
        }
        if (data.type === 'initialize') {
            let htmlString = data.src;
            // 规则。用来先把字符串里的资源路径替换掉
            const rules = data.rules || [];
            rules.forEach(rule => {
                const protocol = rule.protocol;
                const work = rule.work;
                const regex = new RegExp(protocol, 'g');
                htmlString = htmlString.replace(regex, work);
            });

            // 解析 HTML 字符串
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            // 检查解析错误
            if (doc.body.querySelector('parsererror')) {
                console.error('HTML 解析错误');
                return;
            }
            // 清空当前 body 内容
            document.body.innerHTML = '';

            // 处理 head 内容（包括样式和脚本）
            const headElements = Array.from(doc.head.children);
            headElements.forEach(element => {
                if (element.tagName === 'LINK' && element.rel === 'stylesheet' && element.href) {
                    // 强制刷新CSS：移除已有同href的link，再加时间戳参数
                    const existedLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
                    existedLinks.forEach(link => {
                        // 比较去掉参数后的地址，防止多次刷新叠加
                        if (link.href.split('?')[0] === element.href.split('?')[0]) {
                            link.parentNode.removeChild(link);
                        }
                    });
                    // 新建link并加随机参数
                    const newLink = document.createElement('link');
                    Array.from(element.attributes).forEach(attr => {
                        newLink.setAttribute(attr.name, attr.value);
                    });
                    // 加参数强制刷新
                    newLink.href = element.href + (element.href.includes('?') ? '&' : '?') + '_reload=' + Date.now();
                    document.head.appendChild(newLink);
                } else if (element.tagName === 'SCRIPT') {
                    // head里的script重新创建
                    const newScript = document.createElement('script');
                    Array.from(element.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    if (element.src) {
                        newScript.src = element.src;
                    } else {
                        newScript.textContent = element.textContent;
                    }
                    document.head.appendChild(newScript);
                } else {
                    // 其他元素直接clone，保留预加载
                    document.head.appendChild(element.cloneNode(true));
                }
            });

            // 处理 body 内容
            const bodyElements = Array.from(doc.body.children);
            bodyElements.forEach(element => {
                if (element.tagName === 'SCRIPT') {
                    // body中的script也重新创建
                    const newScript = document.createElement('script');
                    Array.from(element.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    if (element.src) {
                        newScript.src = element.src;
                    } else {
                        newScript.textContent = element.textContent;
                    }
                    document.body.appendChild(newScript);
                } else {
                    document.body.appendChild(element.cloneNode(true));
                }
            });
            console.log('WebView 内容初始化完成');
        }
    } catch (error) {
        console.error('处理初始化消息时出错:', error);
    }
});
