/**
 * 实现ajax功能，注意主动调用abort跟断网时请求被中断是完全一样的。
 *
 * 例子：
 *
 * var ajax = require("../io/ajax");
 * ajax({
 *     url: "/api/api.jsp",
 *     timeout: 30000, // 缺少值3秒,
 *     data: { id: 1 }, // 仅method=post时生效，如果传入json对象会被转换成queryString，如果传入字符串则会原样发送
 *     method: "post", // 默认是get
 *     type: "json", // 默认是json
 *     onSuccess: function(jsonObject) { console.log(jsonObject); },
 *     onError: function(xmlHttp) { }, // 当访问出错，比如网络连接不上、解析内容失败时触发，超时也会触发
 *     onTimeout: function(xmlHttp) { }, // 超时触发
 *     onAbort: function() { } // 网络中断时触发
 * });
 *
 */

var getXMLHttpRequest = require("../io/getXMLHttpRequest");
var merge = require("../json/merge");
var jsonToQuery = require("../json/jsonToQuery");
var appendQuery = require("../str/appendQuery");
var console = require("../io/console");
var configUrl = require("lib/util/configUrl");
var _popup_wait = {};

module.exports = function(opts) {
    var xmlHttp = getXMLHttpRequest();
    var tid = 0;
    var path = "plugin/dialog/wait";

    opts = merge({
        "url": "",
        "timeout": 30 * 1000,
        "data": {},
        "onSuccess": function() {},
        "onError": function() {},
        "onTimeout": function() {},
        "onAbort": function() {},
        "method": "get",
        "type": "json" // "text/json/xml"
    }, opts);

    configUrl(opts.url, function(url){
        opts.url = url;
        opts.method = opts.method.toLocaleLowerCase() == "get" ? "get" : "post";

        if (opts["method"] == "get" && opts["data"]) {
            opts["url"] = appendQuery(opts["url"], opts["data"]);
        }

        var closeWait = function(bool, url){
            if(bool && _popup_wait[url]){
                _popup_wait[url].hide();
                delete _popup_wait[url];
            }
        };

        var callback = function() {
            if (xmlHttp.readyState == 4) {
                clearTimeout(tid);
                var data = "";
                tid = 0;

                if (opts["type"] == "xml") {
                    data = xmlHttp.responseXML;
                } else if (opts["type"] == "text") {
                    data = xmlHttp.responseText;
                } else {
                    if (xmlHttp.responseText != null && typeof xmlHttp.responseText == "string") {
                        try {
                            data = (new Function("return "+xmlHttp.responseText))();
                        } catch (ex) {
                            data = {};
                            console.error(ex);
                        }
                    } else {
                        data = {};
                    }
                }

                if (xmlHttp.status == 200) {
                    try {
                        closeWait(opts.wait, url);
                        opts.onSuccess(data);
                    } catch (ex) { console.error(ex); }
                } else if (xmlHttp.status == 401) {
                    closeWait(opts.wait, url);
                    alert("请先登录！");
                    top.location.href = "/login.html";
                } else if (xmlHttp.status == 0) {
                    try {
                        closeWait(opts.wait, url);
                        opts.onAbort(xmlHttp); // 中断或断网
                    } catch (ex) { console.error(ex); }

                    try {
                        closeWait(opts.wait, url);
                        opts.onError(xmlHttp);
                    } catch (ex) { console.error(ex); }
                } else {
                    try {
                        closeWait(opts.wait, url);
                        console.error("请求[" + opts["url"] + "]失败，状态码为" + xmlHttp.status);
                        opts.onError(xmlHttp);
                    } catch (ex) { console.error(ex); }
                }
            }
        }

        xmlHttp.onreadystatechange = callback;
        // xmlHttp.timeout = opts["timeout"]; //IE不支持！
        xmlHttp.open(opts.method, opts.url, true);

        try {
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            if (opts.wait && top.dialogManager && !_popup_wait[url] && !document.querySelector(".m-loading")) {
                _popup_wait[url] = top.dialogManager.getDialog(path)();
                _popup_wait[url].show();
            }
        } catch (ex) {}

        xmlHttp.send(opts.method == "get" ? null : (typeof(opts["data"]) == "string" ? opts["data"] : jsonToQuery(opts["data"])));

        tid = setTimeout(function() {
            tid = 0;
            xmlHttp.abort();

            try {
                closeWait(opts.wait, url);
                opts.onError(xmlHttp);
                opts.onTimeout(xmlHttp);
            } catch (ex) { console.error(ex); }
        }, opts.timeout);
    });

    return xmlHttp;
}
