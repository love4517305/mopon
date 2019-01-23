/**
 * @author benny.zheng
 * @data 2016-07-15
 * @description 自动更新登录页面背景区域
 */
module.exports = function(opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var popup = require("lib/layer/popup");
    var merge = require("lib/json/merge");
    var addEvent = require("lib/evt/add");
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var render = require("./moreMenu.ejs");
    var listRender = require("./moreMenuList.ejs");
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = popup(render({}), merge({
        "autoHide": true,
        "autoDirection": false
    }, opts || {}));

    var node = that.getOuter();

    //-------------事件响应声明---------------
    var evtFuncs = {
        hideMenu: function() {
            that.hide();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(node, "click", evtFuncs.hideMenu);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        updateView: function(list) {
            node.innerHTML = listRender({
                "list": list
            });
        }
    }

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    //---------------暴露API----------------
    that.updateView = custFuncs.updateView;

    return that;
};