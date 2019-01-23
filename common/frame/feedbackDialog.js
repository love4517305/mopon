/**
弹框
 */
module.exports = function(opts) {
    //----------------require--------------
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    
    var trim = require("lib/str/trim");
    var scss = require('./main.scss');
    var render = require("./feedbackDialog.ejs");
    var dialog = require("plugin/dialog/dialog");

    opts = opts || {};
    var config = {
        title: "反馈",
        boxHTML: render({}),
        buttons: [
            { 'id': 'cancel', 'text': '关闭' }
        ],
        width: '36%'
    };
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = dialog(config);
    var node = that.getOuter();

    //-------------事件响应声明---------------
    var evtFuncs = {
        buttonClick: function(evt){
            that.hide("cancel");
        }
    }

    //-------------子模块实例化---------------
    var initMod = function(){
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        that.bind("buttonclick", evtFuncs.buttonClick);
    }

    //-------------自定义函数----------------
    var custFuncs = {
    }

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