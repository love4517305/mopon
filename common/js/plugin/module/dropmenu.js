/**
 * @author chenshuqi
 * 下拉菜单
 */

module.exports = function(node, opts) {
    //----------------require--------------

    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var addEvent = require('lib/evt/add');
    var stopEvent = require('lib/evt/stop');
    var eventProxy = require("lib/evt/proxy");
    var className = require('lib/dom/className');
    var sizzle = require("lib/dom/sizzle");
    var winSize = require("lib/util/winSize");
    var scrollPos = require("lib/util/scrollPos");
    var scrollBarSize = require("lib/dom/scrollBarSize");
    var dropmenuRender = require("plugin/tmpl/dropmenuItems.ejs");
    var selectRender = require("plugin/tmpl/selectItems.ejs");
    var merge = require("lib/json/merge");
    var getType = require("lib/util/getType");
    var each = require("lib/util/each");
    var popup = require("lib/layer/popup");
    var preventDefault = require("lib/evt/preventDefault");
    var closest = require("lib/dom/closest");
    var simScroll = require("plugin/module/simScroll");

    opts = merge({
        top: false,
        selectMenuData: {
            selectItems: []
        },
        autoHide: true,
        promptText: '--请选择--',
        showPromptText: true,   // 是否显示下拉列表里的 '请选择' 占位项，默认显示
        disabled: false,
        setDefaultValue: false, // 是否设置某一项为默认值
        defaultValue: null, // 要设置为默认值的项的值, 和defaultIndex二选一
        defaultIndex: 0 // 要设置为默认值的项的索引值, defaultValue优先
    }, opts || {});
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var menuHTML = null;
    var m_menu = null;
    var isScroll = true;
    var dialogNode = null;
    var m_simScroll = null;
    var timer = null;
    var cache_data = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        showDropMenu: function(e) {
            if(className.has(nodeList.selectedItem, "disabled")) return;
            isScroll = false;
            if (m_menu.getStatus()) {
                return
            }
            stopEvent(e);
            var boundingClientRect = nodeList.selectedItem.getBoundingClientRect();
            var scroll = scrollPos();
            var menuDOM = m_menu.getOuter();
            var menuLeft = boundingClientRect.left + scroll.left; //菜单在页面中的left
            var menuTop = boundingClientRect.top + scroll.top; //菜单在页面中的top

            m_menu.show(menuLeft, menuTop + nodeList.selectedItem.clientHeight);
            menuDOM.style.opacity = 0; //暂时隐藏，以便获得菜单的高度

            //向下展开时，菜单的下边框距离屏幕顶部的距离
            var selectMenuMaxBottom = menuTop + nodeList.selectedItem.clientHeight + menuDOM.clientHeight;
            //向上展开时，菜单的上边框距离屏幕顶部的距离
            var selectMenuMinTop = menuTop - menuDOM.clientHeight;
            var clientSize = winSize();
            var barSize = scrollBarSize();

            // 默认向下展开；向下展开位置不够时，向上展开；向上向下都不够位置放时，向下展开；
            if (selectMenuMaxBottom >= (clientSize.height - barSize.h)) {
                if (selectMenuMinTop >= scroll.top) {
                    m_menu.hide();
                    m_menu.show(menuLeft, selectMenuMinTop);
                }
                menuDOM.style.opacity = 1;
            } else {
                menuDOM.style.opacity = 1;
            }
            menuDOM.style.width = nodeList.selectedItem.offsetWidth + 'px';
            className.remove(nodeList.arrowIcon, 'down');
            className.add(nodeList.arrowIcon, 'up');
        },

        chooseItem: function(e) {
            var key = e.target.getAttribute('data-key');
            var val = key == "" ? opts.promptText : e.target.title;
            custFuncs.setSelected(key == "" ? null : e.target);
            var options = nodeList.realSelect.options;
            m_menu.hide();
            nodeList.selectedItem.innerHTML = val;
            nodeList.selectedItem.title = val;
            node.setAttribute('data-key', key);
            node.setAttribute('data-value', val);
            if (!key) {
                nodeList.realSelect.value = null;
            } else {
                for (var i = 0; i < options.length; i++) {
                    if (options[i].value == key) {
                        options[i].selected = true;
                    }
                }
            }
            className.remove(nodeList.arrowIcon, 'up');
            className.add(nodeList.arrowIcon, 'down');
            that.fire('dropMenuChosed', {
                key: key,
                val: val,
                node: node,
                state: "select",
                id: opts.id,
                ld: opts.ld
            })
        },
        delSearch: function() {
            nodeList.menu.search.value = '';
            custFuncs.clearSearch();
        },
        searchInput: function(ev) {
            if(!cache_data) return;
            clearTimeout(timer);
            timer = setTimeout(function(){
                var v = ev.target.value;
                if(v.length > 0){
                    className.remove(nodeList.menu.del, 'hide');
                }else{
                    custFuncs.clearSearch();
                    return;
                }
                var arr = [];
                if(cache_data.showPromptText){
                    arr.push('<li data-action="select-item" data-key="">'+opts.promptText+'</li>');
                }
                each(cache_data.selectItems, function(res){
                    if(res.val.indexOf(v) > -1){
                        var reg = new RegExp(v, "g");
                        var val = res.val.replace(reg, function(a){
                            return '<em>'+ a +'</em>';
                        });
                        arr.push('<li data-action="select-item" data-key="'+res.key+'" title="'+res.val+'">'+val+'</li>');
                    }
                });
                nodeList.menu.selectMenu.innerHTML = arr.join('');
                custFuncs.setSelected(null, node.getAttribute('data-key'));
                m_simScroll.loadScroll();
            }, 100);
        },

        menuHide: function() {
            className.remove(nodeList.arrowIcon, 'up');
            className.add(nodeList.arrowIcon, 'down');
            isScroll = true;
        },
        closeSelect: function(){
            if(isScroll) return;
            m_menu.hide();
        },
        mouseScroll: function(e){
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            if(elem.getAttribute("data-action") != "select-item" && !isScroll){
                preventDefault(e);
            }
        },
        menuShow: function(){
            custFuncs.showPos();
            m_simScroll.loadScroll();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_menu = popup(menuHTML, {
            autoHide: opts.autoHide,
            mask: false
        });
        nodeList.menu = parseModule(m_menu.getOuter());
        m_simScroll = simScroll(nodeList.menu.selectMenu, {
            border: {
                top: 0,
                bottom: 0
            }
        });
        m_simScroll.init();
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        if (!opts.disabled) {
            m_menu.bind('hide', evtFuncs.menuHide);
            m_menu.bind("show", evtFuncs.menuShow);
            addEvent(nodeList.selectedItem, 'click', evtFuncs.showDropMenu);
            addEvent(nodeList.menu.search, 'keyup', evtFuncs.searchInput);
            addEvent(nodeList.menu.del, 'click', evtFuncs.delSearch);
            var proxy = eventProxy(m_menu.getOuter());
            proxy.add("select-item", "click", evtFuncs.chooseItem);
        }
        dialogNode && addEvent(document, "DOMMouseScroll", evtFuncs.mouseScroll);
        dialogNode && addEvent(document, "mousewheel", evtFuncs.mouseScroll);
        dialogNode && addEvent(dialogNode, "scroll", evtFuncs.closeSelect);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        clearSearch () {
            nodeList.menu.selectMenu.innerHTML = dropmenuRender(cache_data);
            custFuncs.setSelected(null, node.getAttribute('data-key'));
            m_simScroll.loadScroll();
            className.add(nodeList.menu.del, 'hide');
        },
        showPos: function(){
            var items = sizzle("li", nodeList.menu.selectMenu);
            if(items.length === 0) return;
            var h = items[0].offsetHeight;
            var total = 0;
            var isSelect = false;
            each(items, function(item){
                if(className.has(item, "selected")){
                    isSelect = true;
                    return false;
                }else{
                    total += h;
                }
            });
            if(isSelect){
                nodeList.menu.selectMenu.scrollTop = total;
            }
        },
        setSelected: function(node, key){
            var items = sizzle("li", nodeList.menu.selectMenu);
            each(items, function(item){
                if(className.has(item, "selected")){
                    className.remove(item, "selected");
                    return false;
                }
                if(key && item.getAttribute('data-key') == key){
                    key = null;
                    className.add(item, "selected");
                }
            });
            if(node) className.add(node, "selected");
        },
        disabled: function(bool) {
            m_menu.bind('hide', evtFuncs.menuHide);
            addEvent(nodeList.selectedItem, 'click', evtFuncs.showDropMenu);
            var proxy = eventProxy(m_menu.getOuter());
            proxy.add("select-item", "click", evtFuncs.chooseItem);
            if (bool === false) {
                className.remove(nodeList.selectedItem, 'disabled');
            }else{
                className.add(nodeList.selectedItem, 'disabled');
            }
        },

        setWidth: function(width) {
            nodeList.selectedItem.style.width = parseInt(width) + 'px';
            m_menu.getOuter().style.width = parseInt(width) + 'px';
        },

        setHeight: function(height) {
            nodeList.menu.selectMenu.style.maxHeight = parseInt(height) + 'px';
        },
        formatData: function(data) {
            var result = [];
            if (getType(data.selectItems) == "object") {
                each(data.selectItems, function(v, k) {
                    if (k != '') {
                        result.push({ "key": k, "val": v });
                    }
                });
            }
            else {

                for (var i = 0; i < data.selectItems.length; i++) {
                    if (data.selectItems[i].key != '') {
                        result.push({
                            key: data.selectItems[i].key,
                            val: data.selectItems[i].val
                        });
                    }
                }
            }

            return { selectItems: result, showPromptText: !!opts.showPromptText };
        },
        loadData: function(data) {
            var selectHTML = selectRender(custFuncs.formatData(data.selectMenuData));
            cache_data = custFuncs.formatData(data.selectMenuData);
            custFuncs.setSearch(cache_data.selectItems.length);
            var html = dropmenuRender(cache_data);
            nodeList.selectedItem.innerHTML = opts.promptText;
            node.setAttribute('data-key', '');
            node.setAttribute('data-value', '');
            m_menu.hide();
            nodeList.menu.selectMenu.innerHTML = html;
            nodeList.realSelect.innerHTML = selectHTML;
            var defaultValue = nodeList.realSelect.getAttribute('data-default-value');
            var selectIndex = nodeList.realSelect.getAttribute("data-select-index");
            if (defaultValue != null || selectIndex != null) {
                custFuncs.setDefaultValue(true, defaultValue, selectIndex);
            }
        },
        setSearch: function(len) {
            if(len >= 10){//显示搜索
                className.remove(nodeList.menu.selectSearch, 'hide');
                m_simScroll.setOptions({
                    border: {
                        top: 0,
                        bottom: 0
                    },
                    horizontal: {
                        top: 31
                    }
                })
            }else{
                className.add(nodeList.menu.selectSearch, 'hide');
                m_simScroll.setOptions({
                    border: {
                        top: 0,
                        bottom: 0
                    },
                    horizontal: {
                        top: 0
                    }
                })
            }
        },
        changeData:function(data){
            var selectHTML = selectRender(custFuncs.formatData(data.selectMenuData));
            cache_data = custFuncs.formatData(data.selectMenuData);
            custFuncs.setSearch(cache_data.selectItems.length);
            var html = dropmenuRender(cache_data);
            nodeList.selectedItem.innerHTML = opts.promptText;
            node.setAttribute('data-key', '');
            node.setAttribute('data-value', '');
            nodeList.menu.selectMenu.innerHTML = html;
            nodeList.realSelect.innerHTML = selectHTML;
        },
        getOuter: function() {
            return node;
        },

        initView: function(opts) {
            custFuncs.loadData(opts);
            custFuncs.setDefaultValue(opts.setDefaultValue, opts.defaultValue, opts.defaultIndex);
            if (opts.disabled) {
                custFuncs.disabled();
            }
        },

        initData: function(){
            isScroll = true;
            dialogNode = closest(node, ".box");
            if(dialogNode && dialogNode.parentNode){
                if(!className.has(dialogNode.parentNode, "m-dialog-common")){
                    dialogNode = null;
                }
            }else{
                dialogNode = null;
            }
        },

        setDefaultValue: function(setDefaultValue, defaultValue, defaultIndex) {
            if (setDefaultValue) {
                var items = sizzle('[data-action]', nodeList.menu.selectMenu);
                var options = nodeList.realSelect.options;
                var item = null;
                if (defaultValue != null) {
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].getAttribute('data-key') == defaultValue) {
                            item = items[i];
                            options[i].selected = true;
                        }
                    }
                } else if (defaultIndex != null) {
                    item = items[defaultIndex];
                    if (options[defaultIndex]) {
                        options[defaultIndex].selected = true;
                    }
                }
                if (!item) {
                    return;
                }

                var key = item.getAttribute('data-key');
                nodeList.selectedItem.innerHTML = item.innerHTML;
                nodeList.selectedItem.title = item.innerHTML;
                node.setAttribute('data-key', key);
                node.setAttribute('data-value', item.innerHTML);
                if(key != ''){
                    custFuncs.setSelected(item);
                }
                that.fire('dropMenuChosed', {
                    key: key,
                    val: item.innerHTML,
                    state: "trigger",
                    node: node,
                    id: opts.id,
                    ld: opts.ld
                })
            }
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 根据数据初始化模块
        // opts["render"]({ "title": data["title"] });

        // 找到所有带有node-name的节点
        nodeList = parseModule(node);

        menuHTML = '<div class="m-select-menu"><div class="select-search" node-name="selectSearch"><input node-name="search" type="text"/><i class="icon-close hide" title="清除" node-name="del"></i></div><ul class="select-items" node-name="selectMenu"></ul></div>';

        custFuncs.initData();

        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();

        custFuncs.initView(opts)
    }

    //---------------暴露API----------------
    that.init = init;
    that.setWidth = custFuncs.setWidth;
    that.setHeight = custFuncs.setHeight;
    that.loadData = custFuncs.loadData;
    that.getOuter = custFuncs.getOuter;
    that.setDefaultValue = custFuncs.setDefaultValue;
    that.showMenu = evtFuncs.showDropMenu;
    that.disabled = custFuncs.disabled;
    that.changeData = custFuncs.changeData;
    return that;
};
