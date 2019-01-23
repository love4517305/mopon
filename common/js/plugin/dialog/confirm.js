/**
 * @author benny.zheng
 * @data 2016-07-25
 * @description 标准确认弹层
 */

module.exports = function(text, opts) {
    //----------------require--------------
    var render = require("../tmpl/dialog/standard.ejs");
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var merge = require("lib/json/merge");
    var dialog = require("./dialog");
    //-----------声明模块全局变量-------------
    opts = merge({
        icon: "suc", //"err"
        ok: function() {},
        cancel: function() {}
    }, opts || {})

    opts["buttons"] = [
        { "id": "ok", "text": (opts["okText"] || "确定"), "type": "blue" },
        { "id": "cancel", "text": (opts["cancelText"] || "取消") }
    ]

    var boxHTML = render({
        "text": text,
        "icon": opts["icon"]
    });

    opts["boxHTML"] = boxHTML;

    var nodeList = null; // 存储所有关键节点
    var that = dialog(opts);
    var node = that.getOuter();

    //-------------事件响应声明---------------
    var evtFuncs = {
        buttonclick: function(ev) {
            if (ev.data.type == "ok" || ev.data.type == "cancel") {
                try {
                    opts[ev.data.type]();
                    that.hide(ev.data.type);
                }catch(ex) {
                    console.error(ex);
                }
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        that.bind("buttonclick", evtFuncs.buttonclick);
    }

    //-------------自定义函数----------------
    var custFuncs = {}

    //---------------暴露API----------------

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    return that;
};