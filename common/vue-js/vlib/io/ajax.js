/**
 * 实现ajax功能，注意主动调用abort跟断网时请求被中断是完全一样的。
 *
 * 例子：
 *
 * var ajax = require("../io/ajax");
 * ajax({
 *     url: "/api/api.jsp",
 *     timeout: 30000, // 默认 30秒
 *     data: { id: 1 },
 *     method: "post", // 默认是get
 *     type: "json", // 默认是json
 *     success: function(res) { console.log(res); },
 *     error: function(res) { } // 当访问出错，比如网络连接不上、解析内容失败时触发，超时也会触发
 * });
 *
 */

import query from '../json/query'
import merge from '../json/merge'
import {isObject, isFunction, isString, isNumber, isPromise} from '../util/dataType'

let _options = {
    url: "",
    timeout: 30 * 1000,
    data: null,
    stop: false,//是否禁止请求
    success: function(){},
    error: function(){},
    method: "get",
    type: "json", //"text/json/xml"
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
};

let _asyncLock = {
    locks: {},
    get (url, data) {
        return isObject(data) || isString(data) ? query.url(url, data) : url;
    },
    add (url, data) {
        this.locks[this.get(url, data)] = true;
    },
    remove (url, data){
        delete this.locks[this.get(url, data)];
    },
    has (url, data){
        return this.locks[this.get(url, data)];
    }
};

let _defaults = {
    options: _options,
    response: {
        suc: null,
        err: null
    },
    request: {
        suc: null
    }
};

function _response(opts, config, resolve, reject) {
    if (this.readyState === 4) {
        let data = "";
        config.clear();
        if (opts.type === "xml") {
            data = this.responseXML;
        } else if (opts.text === "text") {
            data = this.responseText;
        } else {
            data = this.responseText;
            if (isString(data)) {
                try {
                    data = JSON.parse(data);
                } catch(ex) {
                    data = {};
                }
            } else {
                data = {};
            }
        }

        _asyncLock.remove(opts.url, opts.data);

        if (this.status === 200) {
            this.data = data;
            let suc = isFunction(_defaults.response.suc) ? _defaults.response.suc(this, config.wait) : data;
            if (isPromise(suc)) {
                suc.catch(r => {
                    opts.error(r);
                    reject(r);
                })
            } else {
                opts.success(suc);
                resolve(suc);
            }
        } else {
            let status = this.status;
            // let result = { data: data, status: status, msg: status === 0 ? "已经中断！" : "请求[" + opts.url + "]失败，状态码为" + status };
            let result = { data: data, status: status, msg: status === 0 ? "已经中断！" : "请求失败，状态码为" + status };
            let err = isFunction(_defaults.response.err) ? _defaults.response.err(result, config.wait) : result;
            if(isPromise(err)) {
                err.catch(r => {
                    opts.error(r);
                    reject(r);
                });
            }else{
                opts.error(result);
                reject(result);
            }
        }
    }
}

function _requestTimeout(res, opts, reject) {
    return setTimeout(() => {
        res.abort();
        _asyncLock.remove(opts.url, opts.data);
        let result = {res: res, status: res.status, msg: "请求超时！"};
        console.error(result.msg);
        opts.error(result);
        reject(result);
    }, opts.timeout);
}

function ajax(opts, isWait, lockConfig) {
    return new Promise((resolve, reject) => {
        let xmlHttp = new XMLHttpRequest(), tid = null;
        opts = merge(true, {}, _defaults.options, opts);
        opts.method = opts.method.toLocaleLowerCase() === "get" ? "get" : "post";

        if(isFunction(_defaults.request.suc)){
            opts = _defaults.request.suc(opts, isWait) || opts;
        }

        if (opts.method === "get" && isObject(opts.data)) {
            opts.url = query.url(opts.url, opts.data);
        }

        if(!!lockConfig.lock && _asyncLock.has(opts.url, opts.data)){
            reject({status: 999, msg: "请勿重复请求！"});
            return;
        }

        xmlHttp.onreadystatechange = _response.bind(xmlHttp, opts, {wait: isWait, clear: () => clearTimeout(tid)}, resolve, reject);
        xmlHttp.timeout = opts.timeout;
        xmlHttp.open(opts.method, opts.url, true);

        for(let key in opts.headers){
            xmlHttp.setRequestHeader(key, opts.headers[key]);
        }

        xmlHttp.send(opts.method === "get" ? null : (isString(opts.data) ? opts.data : query.stringify(opts.data)));

        !!lockConfig.lock && _asyncLock.add(opts.url, opts.data);

        !!lockConfig.time && setTimeout(() => {
            _asyncLock.remove(opts.url, opts.data);
        }, lockConfig.time * 1000);

        tid = _requestTimeout(xmlHttp, opts, reject);
    });
}

ajax.create = function (opts) {
    _defaults.options = merge(true, {}, _options, opts);
    return ajax;
};

ajax.response = {
    use(ful, rej) {
        _defaults.response.suc = ful;
        _defaults.response.err = rej;
    }
};

ajax.request = {
    use(ful) {
        _defaults.request.suc = ful;
    }
};

ajax.get = function (url, data) {
    return ajax({url: url, data: data, method: "get"}, this.wait, {lock: this.isLock, time: this.lockTime});
};

ajax.post = function (url, data) {
    return ajax({url: url, data: data, method: "post"}, this.wait, {lock: this.isLock, time: this.lockTime});
};

ajax.wait = {
    wait: true,
    post: ajax.post,
    get: ajax.get
};

ajax.lock = function (lockTime){
    let result = {
        isLock: true,
        post: this.post,
        get: this.get
    };
    if(isNumber(lockTime) && lockTime > 0){
        result.lockTime = lockTime;
    }
    return result;
};

ajax.lock.isLock = true;
ajax.lock.post = ajax.post;
ajax.lock.get = ajax.post;

export default ajax;