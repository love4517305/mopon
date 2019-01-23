/**
 * @author benny.zheng
 * @data 2016-06-06
 * @description 本文件用于方便复制粘贴UI模块之用，请更新这里的说明
 */
module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {}

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 根据数据初始化模块
        // opts["render"]({ "title": data["title"] });

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