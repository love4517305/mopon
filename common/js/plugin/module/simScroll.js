/**
 * @author 璩
 * @data 2017-02-28
 * @description 模拟滚动
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var addEvent = require('lib/evt/add');
    var removeEvent = require('lib/evt/remove');
    var className = require("lib/dom/className");
    var render = require("plugin/tmpl/simScroll.ejs");
    var insertHTML = require("lib/dom/insertHTML");
    var preventDefault = require("lib/evt/preventDefault");
    var merge = require("lib/json/merge");
    var setStyle = require("lib/dom/setStyle");
    // require("plugin/scss/grid.scss");

    //-----------声明模块全局变量-------------
    var nodeList = node; // 存储所有关键节点
    var that = base();
    var data = null;
    var p_timer = null;
    var s_timer = null;

    var defaults = {
        autoChange: false,//自动监控
        border: {//边框宽度
            top: 1,
            right: 1,
            left: 1,
            bottom: 1
        },
        horizontal: {//水平位置
            top: 1,
            right: 1,
            bottom: null,
            left: null
        },
        vertical: {//垂直位置
            top: null,
            right: null,
            bottom: 1,
            left: 1
        }
    };
    opts = merge(true, defaults, opts);

    //-------------事件响应声明---------------
    var evtFuncs = {
        scroll: function(){
            if(!className.has(nodeList.rightSimScroll, "hide")){
                var y = node.scrollTop;
                var h = node.offsetHeight;
                var sh = node.scrollHeight;
                var toolHeight = nodeList.rightScrollTool.offsetHeight;
                nodeList.rightScrollTool.style.top = custFuncs.unit(Math.min(y * h / sh, h - toolHeight - 34));
            }
        },
        scrollRightTool: function(evt){
            var cursorY = evt.clientY;
            var cTop = parseFloat(nodeList.rightScrollTool.style.top || 0.1);
            var h = node.offsetHeight;
            var sh = node.scrollHeight;
            var toolHeight = nodeList.rightScrollTool.offsetHeight;
            function _onmousemove(evt){
                var moveY = evt.clientY;
                var y = moveY - cursorY + cTop;
                var top = Math.max(0, Math.min(h - toolHeight, y));
                var sTop = Math.max(0, Math.min(h - toolHeight - 34, y));
                nodeList.rightScrollTool.style.top = custFuncs.unit(sTop);
                node.scrollTop = top * sh / h;
                preventDefault(evt);
            }
            function _onmouseup(){
                removeEvent(document, "mousemove", _onmousemove);
                removeEvent(document, "mouseup", _onmouseup);
            }
            addEvent(document, "mousemove", _onmousemove);
            addEvent(document, "mouseup", _onmouseup);
        },
        scrollBottomTool: function(evt){
            var cursorX = evt.clientX;
            var cLeft = parseFloat(nodeList.bottomScrollTool.style.left || 0.1);
            var w = node.offsetWidth;
            var sw = node.scrollWidth;
            var toolWidth = nodeList.bottomScrollTool.offsetWidth;
            function _onmousemove(evt){
                var moveX = evt.clientX;
                var x = moveX - cursorX + cLeft;
                var left = Math.max(0, Math.min(w - toolWidth, x));
                var sLeft = Math.max(0, Math.min(w - toolWidth - 36, x));
                nodeList.bottomScrollTool.style.left = custFuncs.unit(sLeft);
                node.scrollLeft = left * sw / w;
                preventDefault(evt);
            }
            function _onmouseup(){
                removeEvent(document, "mousemove", _onmousemove);
                removeEvent(document, "mouseup", _onmouseup);
            }
            addEvent(document, "mousemove", _onmousemove);
            addEvent(document, "mouseup", _onmouseup);
        },
    }

    //-------------子模块实例化---------------
    var initMod = function() {};

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(node, "scroll", evtFuncs.scroll);
        addEvent(nodeList.rightScrollTool, "mousedown", evtFuncs.scrollRightTool);
        addEvent(nodeList.bottomScrollTool, "mousedown", evtFuncs.scrollBottomTool);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        loadScroll: function(){
            clearTimeout(p_timer);
            p_timer = setTimeout(function(){
                var left = node.scrollLeft;
                var top = node.scrollTop;
                node.scrollLeft = 1;
                node.scrollTop = 1;
                var bottomIsScroll = false;
                var overflowX = window.getComputedStyle(node, null).overflowX;
                var overflowY = window.getComputedStyle(node, null).overflowY;
                var w = node.offsetWidth;
                var sw = node.scrollWidth;
                data.w = w;
                data.sw = sw;
                if(node.scrollLeft > 0 && overflowX != "hidden"){
                    bottomIsScroll = true;
                    node.scrollLeft = left;
                    var vStyle = {
                        width: custFuncs.unit(w - opts.border.left - opts.border.right)
                    };
                    if(opts.vertical.right != null){
                        vStyle.right = custFuncs.unit(opts.vertical.right);
                    }else{
                        vStyle.left = custFuncs.unit(opts.vertical.left)
                    }
                    if(opts.vertical.top != null){
                        vStyle.top = custFuncs.unit(opts.vertical.top);
                    }else{
                        vStyle.bottom = custFuncs.unit(opts.vertical.bottom)
                    }
                    setStyle(nodeList.bottomSimScroll, vStyle);
                    className.remove(nodeList.bottomSimScroll, "hide");
                    var toolWidth = (w - 34) * (w - 34) / sw;
                    nodeList.bottomScrollTool.style.width = custFuncs.unit(toolWidth);
                    nodeList.bottomScrollTool.style.left = custFuncs.unit(left * w / sw);
                    that.fire("bottom", {suc: true});
                }else{
                    node.scrollLeft = left;
                    className.add(nodeList.bottomSimScroll, "hide");
                    that.fire("bottom", {suc: false});
                }

                var h = node.offsetHeight;
                var sh = node.scrollHeight;
                data.h = h;
                data.sh = sh;
                if(node.scrollTop > 0 && overflowY != "hidden"){
                    node.scrollTop = top;
                    var hStyle = {
                        height: custFuncs.unit(h - opts.border.top - opts.border.bottom)
                    };
                    if(opts.horizontal.left != null){
                        hStyle.left = custFuncs.unit(opts.horizontal.left);
                    }else{
                        hStyle.right = custFuncs.unit(opts.horizontal.right)
                    }
                    if(opts.horizontal.bottom != null){
                        hStyle.bottom = custFuncs.unit(opts.horizontal.bottom);
                    }else{
                        hStyle.top = custFuncs.unit(opts.horizontal.top)
                    }
                    setStyle(nodeList.rightSimScroll, hStyle);
                    nodeList.scrollRightBg.style.height = custFuncs.unit(h - 34);
                    className.remove(nodeList.rightSimScroll, "hide");
                    var toolHeight = (h - 17 * (bottomIsScroll ? 2 : 1)) * (h - 17 * (bottomIsScroll ? 2 : 1)) / sh;
                    nodeList.rightScrollTool.style.height = custFuncs.unit(toolHeight);
                    nodeList.rightScrollTool.style.top = custFuncs.unit(top * h / sh);
                    that.fire("right", {suc: true});
                }else{
                    node.scrollTop = top;
                    className.add(nodeList.rightSimScroll, "hide");
                    that.fire("right", {suc: false});
                }
                opts.autoChange && custFuncs.scrollTimer();
            }, 10);
        },
        scrollTimer: function(){
            clearInterval(s_timer);
            s_timer = setInterval(function(){
                var w = node.offsetWidth;
                var sw = node.scrollWidth;
                var h = node.offsetHeight;
                var sh = node.scrollHeight;
                if(h != sh && (data.h != h || data.sh != sh)) {
                    custFuncs.loadScroll();
                }else if(w != sw && (data.w != w || data.sw != sw)){
                    custFuncs.loadScroll();
                }
            }, 200);
        },
        unit: function (v) {
            if (!isNaN(v)) {
                return v + "px";
            }
            return v;
        },
        setOptions: function(obj){
            opts = merge(true, opts, obj || {});
        },
        initView: function(){
            insertHTML(node, render({}), "afterend");
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = {};

        custFuncs.initView();
        // 找到所有带有node-name的节点
        nodeList = parseModule(node.parentNode);
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;
    that.loadScroll = custFuncs.loadScroll;
    that.setOptions = custFuncs.setOptions;

    return that;
};