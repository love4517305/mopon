/**
 * @author 璩
 * @data 2016-09-28
 * @description load
 */

module.exports = (function() {
    //----------------require--------------

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var ele = null;
    var that = {};
    var html = '<div class="loading"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>';

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {
        initView: function(){
            ele = document.createElement("DIV");
            ele.className = "m-loading";
            ele.innerHTML = html;
        },
        show: function(node, style){
            if(node) ele.className = "m-loading m-loading-dialog";
            node = node||document.body;
            if(style){
                ele.style.cssText = style;
            }
            node.appendChild(ele);
        },
        hide: function(node){
            node = node||document.body;
            node.removeChild(ele);
        }
    }

    //---------------暴露API----------------

    //-------------一切从这开始--------------

    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    custFuncs.initView();

    that.show = custFuncs.show;
    that.hide = custFuncs.hide;

    return that;
})();