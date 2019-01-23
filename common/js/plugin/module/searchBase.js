/**
 * 搜索
 */

module.exports = function(node, opts) {
    //----------------require--------------

    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var formVerify = require("../util/formVerify");
    var addEvent = require('lib/evt/add');
    var calendar = require("plugin/module/calendar");
    var dialogManager = require("vs/plugin/dialog").default;
    var className = require("lib/dom/className");
    var opra = require("lib/dom/node");
    var each = require("lib/util/each");
    var insertHTML = require("lib/dom/insertHTML");
    var insertNode = require("lib/dom/insertNode");
    var getType = require("lib/util/getType");
    var closest = require("lib/dom/closest");
    var sizzle = require("lib/dom/sizzle");
    var merge = require("lib/json/merge");
    var preventDefault = require("lib/evt/preventDefault");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var m_formVerify = null;
    var conditions = null;
    var addNodeList = [];
    var m_calendar = null;
    var m_timer = null;
    var itemsSize = (opts && opts.itemSize) ? opts.itemSize : {"min":"50px", "max":"56px"} 

    //-------------事件响应声明---------------
    var evtFuncs = {
        search: function() {
            custFuncs.run();
        },
        verify: function(evt) {
            that.unLock();
            var data = evt.data;
            if (!data.yes) {
                dialogManager.error(data.statusText);
                return;
            }

            var success = true;

            if(getType(nodeList.calendar) == "array"){
                each(nodeList.calendar, function(item){
                    var parent = closest(item, ".m-search-condition");
                    var list = sizzle("[node-name='calendar']", parent);
                    if(list.length == 2 && list[0].value != "" && list[1].value != "" && list[0].name.toLowerCase().indexOf("start") != -1 && list[1].name.toLowerCase().indexOf("end") != -1){
                        var date1 = new Date(list[0].value.replace(/\-/g, "/")).getTime();
                        var date2 = new Date(list[1].value.replace(/\-/g, "/")).getTime();
                        if(date1 > date2){
                            dialogManager.error("起始日期不能大于结束日期！");
                            list[0].focus();
                            success = false;
                            return false;
                        }
                    }
                });
            }

            if(!success) return;

            that.fire('search', {
                conditions: data.result
            });

            conditions = data.result;
        },
        showMore: function() {
            var elem = nodeList.more;
            var type = elem.getAttribute("data-type");
            if (type == "hide") {
                elem.setAttribute("data-type", "show");
                className.add(elem, "up");
                nodeList.items.style.height = nodeList.items.scrollHeight + "px";
                clearTimeout(m_timer);
                m_timer = setTimeout(function(){
                    nodeList.items.style.height = nodeList.items.scrollHeight + "px";
                }, 300);
            } else {
                elem.setAttribute("data-type", "hide");
                className.remove(elem, "up");
                nodeList.items.style.height = custFuncs.media(itemsSize.min, itemsSize.max);
            }
        },
        resize: function(){
            custFuncs.setSize();
        },
        addItem: function(e){
            var len = addNodeList.length;
            if(len >= 3){
                dialogManager.error("最多只能添加5个对比的日期！");
                return;
            }
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            if(className.has(elem, "icon")){
                elem = elem.parentNode;
            }
            var parent = elem.parentNode;
            var node = opra.prev(parent);
            var obj = {"-1": "二", "0": "三", "1": "四", "2": "五"};
            var html = '<li class="item">' + node.innerHTML + '</li>';
            html = html.replace(/<span class="label">?.*<\/span>/, "").replace(/value="?.*"/, 'value=""').replace(new RegExp(obj[len - 1], "g"), obj[len]);
            insertHTML(parent, html, "beforebegin");
            var newNode = opra.prev(parent);
            var items = parseModule(newNode);
            if(items.calendar){
                addNodeList.push({node: newNode, type: "date", date: items.calendar});
                m_calendar.add(items.calendar);
            }else{
                addNodeList.push({node: newNode, type: "other"});
            }
            nodeList.list = opra.childNodes(nodeList.items);
            custFuncs.setSize();
            className.remove(opra.next(elem), "gray");
        },
        delItem: function(e){
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            if(className.has(elem, "icon")){
                elem = elem.parentNode;
            }
            if(addNodeList.length == 0){
                return;
            }
            var obj = addNodeList[addNodeList.length - 1];
            if(obj.type == "date"){
                m_calendar.remove(obj.date);
            }
            nodeList.items.removeChild(obj.node);
            addNodeList.pop();
            if(addNodeList.length == 0){
                className.add(elem, "gray");
            }
            custFuncs.setSize();
        },
        disTab: function(e){
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            if(e.keyCode == 9 && closest(elem, ".m-search-wrap")){
                preventDefault(e);
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_formVerify = formVerify(node, merge(opts, {enter: true}));
        m_formVerify.init();
        if(nodeList.calendar){
            m_calendar = calendar(nodeList.calendar, opts);
        }
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(nodeList.search, "click", evtFuncs.search);
        addEvent(nodeList.more, "click", evtFuncs.showMore);
        nodeList.add && addEvent(nodeList.add, "click", evtFuncs.addItem);
        nodeList.del && addEvent(nodeList.del, "click", evtFuncs.delItem);
        addEvent(window, "resize", evtFuncs.resize);
        addEvent(window, "keydown", evtFuncs.disTab);
        m_formVerify.bind("verify", evtFuncs.verify);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        media: function(min, max){
            if(document.body.offsetWidth <= 1400){
                return min;
            }
            return max;
        },
        getCalendar: function() {
            return m_calendar;
        },
        getCurConditions: function() {
            return conditions;
        },
        setSize: function(){
            var all = Math.max(800, node.offsetWidth - 200);
            var len = 0;
            if(nodeList.curNode){
                nodeList.curNode.removeAttribute("style");
                delete nodeList.curNode;
            }
            each(nodeList.list, function(item, index){
                var width = item.offsetWidth;
                len += width;
                if(len > all){
                    nodeList.curNode = item;
                    if(index > 0) item.style.clear = "both";
                    all = len - width;
                    return false;
                }
            });

            if(nodeList.more.getAttribute("data-type") == "show" && len > all){
                nodeList.items.style.height = "auto";
            }else{
                nodeList.items.style.height = custFuncs.media(itemsSize.min, itemsSize.max);
            }
            nodeList.searchBut.style.left = Math.min(len, all) + "px";
                if(all >= len){
                    className.add(nodeList.moreBtn, "hide");
                }else{
                className.remove(nodeList.moreBtn, "hide");
            }
        },
        run: function(){
            if (that.isLock()) {
                return;
            }
            that.lock();
            m_formVerify.run();
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 找到所有带有node-name的节点
        nodeList = parseModule(node);
        nodeList.list = opra.childNodes(nodeList.items);
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
        custFuncs.setSize();
    }

    //---------------暴露API----------------
    that.init = init;
    that.getCurConditions = custFuncs.getCurConditions;
    that.search = custFuncs.run;
    that.setSize = custFuncs.setSize;
    that.getCalendar = custFuncs.getCalendar;

    return that;
};
