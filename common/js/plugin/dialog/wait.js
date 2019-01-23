/**
 * @author 璩
 * @data 2016-09-28
 * @description load
 */

module.exports = function() {
    //----------------require--------------
    var popup = require("lib/layer/popup");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点

    var that = popup('<div class="mg-win-wait"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>', {
        mask: true,
        keepMiddle: true,
        middleFix: 0
    });

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {}

    //---------------暴露API----------------

    //-------------一切从这开始--------------

    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    return that;
};