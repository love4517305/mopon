/**
 * @author benny.zheng
 * @data 2016-07-25
 * @description win弹框
 * 不要再使用这个东西
 */

module.exports = function(opts) {
    //----------------require--------------
    var defaultTemplateRender = require("../tmpl/dialog/win.ejs");
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var merge = require("lib/json/merge");
    var dialog = require("./dialog");
    var getType = require("lib/util/getType");
    var each = require("lib/util/each");
    //-----------声明模块全局变量-------------
    opts = merge({
        title: "提示",
        html: "",
        width: "200px",
        height: "120px",
        btn: [],
        buttons: {}
    }, opts || {});

    opts.template = defaultTemplateRender(opts);

    if(getType(opts.btn) == "array"){
        each(opts.btn, function(item){
            opts.buttons[item.name] = function(){ this.trigger(item.name); };
        });
    }

    var nodeList = null; // 存储所有关键节点
    var that = dialog(opts);
    var node = that.getOuter();

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        if(getType(opts.close) == "function"){
            that.bind("hide", opts.close);
        }
    }

    //-------------自定义函数----------------
    var custFuncs = {
        initView: function() {
            nodeList.box.innerHTML = opts.html;
            nodeList = parseModule(node);
        },
        getNodeList: function() {
            return nodeList;
        }
    }

    //---------------暴露API----------------
    that.getNodeList = custFuncs.getNodeList;
    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    custFuncs.initView();

    return that;
};