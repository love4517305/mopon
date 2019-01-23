/**
 * @author 璩
 * @data 2016-00-19
 * @description 右键菜单
 * var contextMenu = require("plugin/module/contextMenu");
 * var menu = contextMenu(node, {
 *      action: "item",//可选
        items: [
            { text: '收藏当前选项', id: "save"},
            { text: '关闭当前选项', id: "cur"},
            { text: '关闭非当前选项', id: "other"},
            { text: '关闭左边所有', id: "left"},
            { text: '关闭右边所有', id: "right"}
        ]
 * });
 * menu.init();
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var render = require("plugin/tmpl/contextMenu.ejs");
    var popup = require("lib/layer/popup");
    var eventProxy = require("lib/evt/proxy");
    var addEvent = require('lib/evt/add');
    var removeEvent = require('lib/evt/remove');
    var preventDefault = require("lib/evt/preventDefault");
    var isNode = require("lib/dom/isNode");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var m_menu = null;
    var curNode = null;
    opts = opts || {};

    //-------------事件响应声明---------------
    var evtFuncs = {
        dropMenu: function(evt){
            var self = evt.target;
            var id = self.getAttribute("data-id") || "click";
            that.fire("click", {
                type: id,
                node: curNode
            });
            custFuncs.hideMenu();
        },
        proxyShowMenu: function(e){
            curNode = e.target;
            var x = e.event.pageX || e.event.clientX + document.body.scrollTop - document.body.clientTop;
            var y = e.event.pageY || e.event.clientY + document.body.scrollLeft - document.body.clientLeft;
            m_menu.show(x + 5, y + 5);
            preventDefault(e.event);
        },
        showMenu: function(e){
            curNode = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            var x = e.pageX || e.clientX + document.body.scrollTop - document.body.clientTop;
            var y = e.pageY || e.clientY + document.body.scrollLeft - document.body.clientLeft;
            m_menu.show(x + 5, y + 5);
            preventDefault(e);
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        eventProxy(m_menu.getOuter()).add("item", "click", evtFuncs.dropMenu);
        if(opts.action && isNode(node)){
            eventProxy(node).add(opts.action, "contextmenu", evtFuncs.proxyShowMenu);
        }else if(isNode(node)){
            addEvent(node, "contextmenu", evtFuncs.showMenu);
        }
    }

    //-------------自定义函数----------------
    var custFuncs = {
        hideMenu: function(){
            m_menu.hide();
        },
        createMenu: function(){
            m_menu = popup(render(opts), {
                autoHide: true
            });
        },
        bindMenu: function(element){
            if(opts.action){
                var proxy = isNode(element) ? eventProxy(element) : element;
                proxy.add(opts.action, "contextmenu", evtFuncs.proxyShowMenu);
            }else if(isNode(element)){
                addEvent(element, "contextmenu", evtFuncs.showMenu);
            }
        },
        unbindMenu: function(element){
            if(opts.action){
                var proxy = isNode(element) ? eventProxy(element) : element;
                proxy.remove(opts.action, "contextmenu", evtFuncs.proxyShowMenu);
            }else if(isNode(element)){
                removeEvent(element, "contextmenu", evtFuncs.showMenu);
            }
        }
    }


    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        custFuncs.createMenu();
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;
    that.bindMenu = custFuncs.bindMenu;
    that.unbindMenu = custFuncs.unbindMenu;

    return that;
};