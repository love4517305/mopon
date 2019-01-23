/**
 * @author benny.zheng
 * @data 2016-07-25
 * @description 弹层外壳
 */

module.exports = function(opts) {
    //----------------require--------------
    var base = require("../comp/base"); // 基础对象
    var parseModule = require("../dom/parseModule"); // 页面模块自动解析
    var builder = require("../layer/builder");
    var merge = require("../json/merge");

    //-----------声明模块全局变量-------------

    opts = merge({
        header: true, // 是否有头部
        footer: true, // 是否有底部
        close: true,  // 是否有X
        title: "弹层标题" // 当有头部时起效，允许为html
        // 允许在footer中使用<a data-button="ok">确认</a>来新增按钮，然后传buttons来增加回调函数。也可以绑定hide事件，根据ev.why来判断
        // buttons: {
        //     "ok": function() {},
        //     "cancel": function() {}
        // }
    }, opts || {})


    var nodeList = null; // 存储所有关键节点
    var that = builder.createFromHTML(opts["template"]);
    var node = that.getOuter();

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {}

    //-------------一切从这开始--------------

    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    //---------------暴露API----------------

    return that;
};