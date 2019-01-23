/**
 * 所有弹层都应该在这里注册
 * 由主页面监听各iframe的弹层请求
 */
var each = require("lib/util/each");
var postMessager = require("lib/io/postMessager");
var modules = {
    "plugin/dialog/alert": require("./alert"),
    "plugin/dialog/confirm": require("./confirm"),
    "plugin/dialog/win": require("./win")
}

var messager = postMessager(function(ev) {
    var msg = ev.data;
    var fromKey = ev.fromKey;

    if (msg["for"] != "plugin/dialog/server") {
        return;
    }

    var eventHandler = function(ev) {
        messager.send({
            "type": ev.type,
            "data": ev.data
        }, fromKey);
    }

    var creater = modules[msg["layerId"]];

    if (creater == null) {
        console.error("无法找到弹层模块" + msg["layerId"]);
        return;
    }

    var entry = creater.apply(window, [].concat(msg["opts"]));

    each(msg["events"] || [], function(evName) {
        entry.bind(evName, eventHandler);
    });

    entry.show();
}, true);