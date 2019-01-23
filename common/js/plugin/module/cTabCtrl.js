/**
 * @author benny.zheng
 * @data 2016-07-15
 * @description 自动更新登录页面背景区域
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var proxy = require("lib/evt/proxy");
    var className = require("lib/dom/className");
    var opra = require("lib/dom/node");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var lastNode = null;
    var m_proxy = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        tabItemSelect: function(evt){
            var self = evt.target;
            if(className.has(self, "checked")){
               return;
            }
            if(lastNode) className.remove(lastNode, "checked");
            else className.remove(opra.childNodes(node), "checked");
            className.add(self, "checked");
            lastNode = self;
            var key = self.getAttribute("data-key");
            that.fire("change", {
                key: key
            })
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_proxy = proxy(node);
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        m_proxy.add("item", "click", evtFuncs.tabItemSelect);
    }

    //-------------自定义函数----------------
    var custFuncs = {}

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 找到所有带有node-name的节点
        nodeList = parseModule(node);
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;

    return that;
};