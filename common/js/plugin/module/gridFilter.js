/**
 * @author 璩
 * @data 2018-03-21
 * @description 表格右键菜单
 */

module.exports = function(action, isShow) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var render = require("plugin/tmpl/gridFilter.ejs");
    var eventProxy = require("lib/evt/proxy");
    var addEvent = require('lib/evt/add');
    var popup = require("lib/layer/popup");
    var preventDefault = require("lib/evt/preventDefault");
    var className = require("lib/dom/className");
    var dataset = require("lib/dom/dataset");
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var debounce = require("vlib/util/debounce");
    var dialogManager = require('vs/plugin/dialog').default;
    var clone = require("lib/json/clone");
    var getPosition = require("lib/dom/getPosition");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var m_menu = null;
    var curNode = null;
    var field = null;
    var m_debounce = null;
    var opts = {
        cache: [],
        columns: [],
        colFilter: {},
        data: [],
        dataFilter: {},
        content: ""
    };

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
            m_menu.hide();
            field = dataset.get(e.target, "field");
            var x = e.event.pageX || e.event.clientX + document.body.scrollTop - document.body.clientTop;
            var y = e.event.pageY || e.event.clientY + document.body.scrollLeft - document.body.clientLeft;
            if(document.body.offsetWidth - x < 365){
                className.add(nodeList.filter, "left");
                m_menu.show(x - 165, y + 5);
            }else{
                className.remove(nodeList.filter, "left");
                m_menu.show(x + 5, y + 5);
            }
            className.add(nodeList.filter, "hide");
            preventDefault(e.event);
        },
        hideChild: function(e){
            className.add(nodeList.filter, "hide");
        },
        mouseEnter: function(e) {
            let node = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            className.add(nodeList.filter, "hide");
            if(className.has(node, "child")){
                let index = dataset.get(node, "index");
                if(index === '0'){
                    nodeList.displayCols.innerHTML = custFuncs.getColumnHTML();
                }else if(index === '1'){
                    custFuncs.filterData(true);
                }
                className.remove(nodeList.filter[index], "hide");
            }else{
                m_menu.hide();
                that.fire("click", {
                    type: dataset.get(node, "type"),
                    name: field
                });
                className.add(nodeList.filter, "hide");
            }
        },
        displayColsChecked: function(){
            custFuncs.changeDisplayChecked();
        },
        dropDisplay: function(e){
            var index = e.target.value;
            opts.columns[index].checked = !opts.columns[index].checked;
            custFuncs.changeDisplayAllChecked();
        },
        colsChecked: function(){
            custFuncs.changeColsChecked();
        },
        dropCols: function(e){
            var index = e.target.value;
            var obj = opts.data[index];
            var val = obj.res[field];
            var bool = !obj.checked;
            obj.checked = bool;
            each(opts.data, function(item, i){
                var value = item.res[field];
                if(i != index && value == val){
                    item.checked = bool;
                }
            });
            custFuncs.changeColsAllChecked();
        },
        cancel: function(){
            className.add(nodeList.filter, "hide");
        },
        submit: function(e){
            var node = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            var type = dataset.get(node, "type");
            if(type === "0"){
                var suc = false;
                each(opts.columns, function(item){
                    if(!suc && opts.colFilter[item.index] !== item.checked){
                        suc = true;
                    }
                    opts.colFilter[item.index] = item.checked;
                });
                var arr = [];
                if(suc){
                    opts.cache.forEach(function(item, index){
                        if(opts.colFilter[index] || !item.name){
                            arr.push(item);
                        }
                    });
                }
                if(suc && arr.length === 0){
                    dialogManager.error("请至少选择一项！");
                    return;
                }
                suc && that.fire("filter", {
                    data: arr,
                    type: "cols"
                });
            }else if(type === "1"){
                var suc1 = false;
                each(opts.data, function(item){
                    if(!suc1 && opts.dataFilter[item.index] !== item.checked){
                        suc1 = true;
                    }
                    opts.dataFilter[item.index] = item.checked;
                });
                suc1 && that.fire("filter", {
                    data: opts.dataFilter,
                    type: "data"
                });
                nodeList.searchInput.value = "";
            }
            m_menu.hide();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_debounce = debounce.default(custFuncs.filterData, 200);
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        var proxy = eventProxy(m_menu.getOuter());
        proxy.add("display", "click", evtFuncs.dropDisplay);
        proxy.add("cols", "click", evtFuncs.dropCols);
        addEvent(nodeList.fixed, "click", evtFuncs.mouseEnter);
        addEvent(nodeList.fixed, "mouseenter", evtFuncs.hideChild);
        addEvent(nodeList.item, "mouseenter", evtFuncs.mouseEnter);
        addEvent(nodeList.searchInput, "input", m_debounce);
        addEvent(nodeList.displayColsChecked, "click", evtFuncs.displayColsChecked);
        addEvent(nodeList.colsChecked, "click", evtFuncs.colsChecked);
        addEvent(nodeList.cancel, "click", evtFuncs.cancel);
        addEvent(nodeList.ok, "click", evtFuncs.submit);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        changeDisplayChecked: function(){
            var bool = nodeList.displayColsChecked.checked;
            each(opts.columns, function(item){
                item.checked = bool;
            });
            nodeList.displayCols.innerHTML = custFuncs.getColumnHTML();
        },
        changeDisplayAllChecked: function(){
            let bool = true;
            each(opts.columns, function(item){
                if(!item.checked && bool){
                    bool = false;
                }
            });
            nodeList.displayColsChecked.checked = bool;
        },
        getColumnHTML: function() {
            var str = '';
            each(opts.columns, function(item){
                str += '<li><label title="'+ item.value + '"><input data-action="display" value="'+item.index+'" type="checkbox" '+ (item.checked ? 'checked="checked"':'') +'/><i class="checkbox"></i><span>'+ item.value + '</span></label></li>';
            });
            custFuncs.changeDisplayAllChecked();
            return str;
        },
        setColumns: function(data) {
            opts.cache = clone(data);
            opts.colFilter = {};
            each(data, function(item, index){
                if(item.name){
                    opts.colFilter[index] = true;
                    opts.columns.push({checked: true, value: item.display, index: index});
                }
            });
        },
        changeColsChecked: function(){
            var bool = nodeList.colsChecked.checked;
            opts.content = "";
            nodeList.searchInput.value = "";
            nodeList.gridCols.innerHTML = custFuncs.getDataHTML(null, bool);
        },
        changeColsAllChecked: function(b){
            if(getType(b) === "boolean"){
                nodeList.colsChecked.checked = b;
            }else{
                let bool = true;
                each(opts.data, function(item){
                    if(bool && !item.checked){
                        bool = false;
                    }
                });
                nodeList.colsChecked.checked = bool;
            }
        },
        filterData: function(bool){
            var value = nodeList.searchInput.value.trim();
            if(value === opts.content && !bool){
                return;
            }
            if(value === ""){
                opts.content = "";
                nodeList.gridCols.innerHTML = custFuncs.getDataHTML();
            }else{
                opts.content = value;
                nodeList.gridCols.innerHTML = custFuncs.getDataHTML(value, true);
            }
        },
        getDataHTML: function(v, bool) {
            var str = '',set = {};
            each(opts.data, function(item){
                item.checked = false;
                var value = item.res[field];
                var isVal = getType(value) !== "undefined";
                if(getType(v) === "undefined"){
                    if(opts.dataFilter[item.index]){
                        item.checked = true;
                    }
                }else if(v === null && getType(bool) === "boolean"){//选择所有
                    item.checked = bool;
                }else {//筛选
                    if(isVal && (value+"").indexOf(v) > -1){
                        item.checked = bool;
                    }else{
                        return;
                    }
                }

                if(isVal && !set[value]){
                    set[value] = true;
                    str += '<li><label title="'+ value + '"><input data-action="cols" value="'+item.index+'" type="checkbox" '+ (item.checked ? 'checked="checked"':'') +'/><i class="checkbox"></i><span>'+ value + '</span></label></li>';
                }else if(!isVal && !set["_null"]){
                    set["_null"] = true;
                    str += '<li><label title="[空值]"><input data-action="cols" value="'+item.index+'" type="checkbox" '+ (item.checked ? 'checked="checked"':'') +'/><i class="checkbox"></i><span>[空值]</span></label></li>';
                }
            });
            custFuncs.changeColsAllChecked(bool);
            return str;
        },
        setData: function(data) {
            opts.colFilter = {};
            each(data, function(item, index){
                opts.dataFilter[index] = false;
                opts.data.push({checked: false, value: "", index: index, res: item});
            });
        },
        getDataFilter: function() {
            if(opts.content === ""){
                return {};
            }else{
                each(opts.data, function(item){
                    item.checked = false;
                    var value = item.res[field];
                    var isVal = getType(value) !== "undefined";
                    item.checked = (isVal && (value+"").indexOf(opts.content) > -1);
                    opts.dataFilter[item.index] = item.checked;
                });

                return opts.dataFilter;
            }
        },
        hideMenu: function(){
            m_menu.hide();
        },
        createMenu: function(){
            m_menu = popup(render({show: isShow}), {
                autoHide: true
            });
        },
        bindMenu: function(proxy){
            proxy.add(action, "contextmenu", evtFuncs.proxyShowMenu);
        },
        unbindMenu: function(proxy){
            proxy.remove(action, "contextmenu", evtFuncs.proxyShowMenu);
        }
    }


    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        custFuncs.createMenu();
        nodeList = parseModule(m_menu.getOuter());

        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;
    that.bindMenu = custFuncs.bindMenu;
    that.unbindMenu = custFuncs.unbindMenu;
    that.setColumns = custFuncs.setColumns;
    that.setData = custFuncs.setData;
    that.getDataFilter = custFuncs.getDataFilter;

    return that;
};