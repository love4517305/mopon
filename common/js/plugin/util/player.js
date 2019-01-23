/**
 播放器
 **/

module.exports = function (node, opts) {
    //----------------require--------------

    var base = require("lib/comp/base"); // 基础对象
    var sizzle = require("lib/dom/sizzle");
    var queryToJson = require("lib/json/queryToJson");
    var merge = require("lib/json/merge");
    var getType = require("lib/util/getType");
    var trim = require("lib/str/trim");
    var each = require("lib/util/each");
/*
 <video style="width: 500px; height: 300px;" controls="controls" src="https://vplscdn.videojj.com/video/experience.mp4" autoplay="autoplay"></video>
 */
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function () {}

    //-------------绑定事件------------------
    var bindEvents = function () {}

    //-------------自定义函数----------------
    var custFuncs = {

    }

    //-------------一切从这开始--------------
    var init = function (_data) {
        data = _data;
        // //console.log(data);
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
        custFuncs.initForm();
    }

    //---------------暴露API----------------
    that.init = init;

    return that;
};