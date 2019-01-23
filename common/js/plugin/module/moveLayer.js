/**
 * @author 璩
 * @data 2016-11-29
 * @description 移动弹层
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var addEvent = require('lib/evt/add');
    var removeEvent = require('lib/evt/remove');
    var preventDefault = require("lib/evt/preventDefault");
    var merge = require("lib/json/merge");
    var getPosition = require("lib/dom/getPosition");

    //-----------声明模块全局变量-------------
    var that = base();
    var defaults = {
        direct: "move",//方向left|right|top|bottom|brc
        cursor: true,
        limit: false,//是否限制弹框移动到屏目之后
        box: null,//内容节点
        layer: null,//弹层节点
        inner: 0,//内间距
        outside: 0//外边距
    };
    var data = null;

    opts = merge(defaults, opts);

    var cursorValue = {
        move: "move",
        left: "w-resize",
        right: "e-resize",
        top: "n-resize",
        bottom: "s-resize",
        brc: "nwse-resize"
    };

    //-------------事件响应声明---------------
    var evtFuncs = {
        mouseDown : function(e){
            preventDefault(e);
            var cursorX = e.pageX || e.clientX + document.body.scrollTop - document.body.clientTop;
            var cursorY = e.pageY || e.clientY + document.body.scrollLeft - document.body.clientLeft;
            var layer = opts.layer === null ? node : opts.layer;
            var box = opts.box === null ? layer : opts.box;
            var pos = getPosition(layer);
            var top = pos.top;
            var left = pos.left;
            var boxWidth = box.offsetWidth;
            var boxHeight = box.offsetHeight;
            var layerWidth = layer.offsetWidth;
            var layerHeight = layer.offsetHeight;
            var iWidth = document.body.offsetWidth;
            var iHeight = document.body.offsetHeight;
            that.fire("down");
            function _onmousemove(e){
                e = e || window.event;
                var moveX = e.pageX || e.clientX + document.body.scrollTop - document.body.clientTop;
                var moveY = e.pageY || e.clientY + document.body.scrollLeft - document.body.clientLeft;
                var gadX = moveX - cursorX;
                var gadY = moveY - cursorY;
                var x = 0, y = 0, realW = 0, realH = 0;
                switch(opts.direct){
                    case "move":
                        x = opts.limit ? Math.max(0, Math.min(iWidth - opts.outside - layerWidth, left + gadX)) : left + gadX;
                        y = opts.limit ? Math.max(0, Math.min(iHeight - - opts.outside - layerHeight, top + gadY)) : top + gadY;
                        layer.style.left = x + "px";
                        layer.style.top = y + "px";
                        break;
                    case "left":
                        x = Math.min(left + boxWidth - Math.abs(opts.inner), Math.max(0, left + gadX));
                        realW = Math.max(Math.abs(opts.inner), Math.min(boxWidth + left, boxWidth - gadX));
                        box.style.width = realW + "px";
                        layer.style.left = x + "px";
                        break;
                    case "right":
                        realW = Math.max(Math.abs(opts.inner), Math.min(iWidth - left - opts.outside - (layerWidth - boxWidth), boxWidth + gadX));
                        box.style.width = realW + "px";
                        break;
                    case "top":
                        y = Math.min(top + boxHeight - Math.abs(opts.inner), Math.max(0, top + gadY));
                        realH = Math.max(Math.abs(opts.inner), Math.min(boxHeight + top, boxHeight - gadY));
                        box.style.height = realH + "px";
                        layer.style.top = y + "px";
                        break;
                    case "bottom":
                        realH = Math.max(Math.abs(opts.inner), Math.min(iHeight - top - opts.outside - (layerHeight - boxHeight), boxHeight + gadY));
                        box.style.height = realH + "px";
                        break;
                    case "brc":
                        realW = Math.max(Math.abs(opts.inner), Math.min(iWidth - left - opts.outside - (layerWidth - boxWidth), boxWidth + gadX));
                        realH = Math.max(Math.abs(opts.inner), Math.min(iHeight - top - opts.outside - (layerHeight - boxHeight), boxHeight + gadY));
                        box.style.width = realW + "px";
                        box.style.height = realH + "px";
                        break;
                }
                preventDefault(e);
            }
            function _onmouseup(){
                removeEvent(document, "mousemove", _onmousemove);
                removeEvent(document, "mouseup", _onmouseup);
                that.fire("up");
            }
            addEvent(document, "mousemove", _onmousemove);
            addEvent(document, "mouseup", _onmouseup);
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(node, "mousedown", evtFuncs.mouseDown);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        initView : function(){
            opts.cursor && (node.style.cursor = cursorValue[opts.direct]);
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
        custFuncs.initView();
    }

    //---------------暴露API----------------
    that.init = init;

    return that;
};