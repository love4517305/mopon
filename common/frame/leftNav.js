/**
 * @author 璩
 * @data 2016-07-15
 * @description 自动更新登录页面背景区域
 */
module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var sizzle = require("lib/dom/sizzle");
    var closest = require("lib/dom/closest");
    var proxy = require("lib/evt/proxy");
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var leftNavRender = require("./leftNav.ejs"); // 模板
    var className = require("lib/dom/className");
    var nodeOpera = require("lib/dom/node");
    var each = require("lib/util/each");
    var addEvent = require('lib/evt/add');
    var storage = require('vlib/util/storage').default;
    var api = require("vs/api").default;

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var m_proxy = null;
    var tid = 0;
    var moduleName = null;
    var lastMenuId = null;
    var lastNode = null;
    var defaultMax = null;
    var menuNodes = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        menu: function(ev) {
            custFuncs.switchMenu(ev.target.getAttribute("data-menu-id"), ev.target);
        },
        resetHeight: function(){
            var rw = document.body.offsetWidth;
            if(menuNodes !== null && (rw <= 1400 && defaultMax > 1400) || (rw > 1400 && defaultMax <= 1400)){
                var cArr = [];
                menuNodes.forEach(function(item){
                    var height = item.offsetHeight;
                    if(height !== 0){
                        item.style.height = "auto";
                        cArr.push(item);
                    }
                });
                cArr.forEach(function(item){
                    var rh = item.scrollHeight;
                    item.setAttribute("data-height", rh);
                    item.style.height = rh + "px";
                });
                defaultMax = rw;
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_proxy = proxy(node);
        addEvent(window, "resize", evtFuncs.resetHeight);
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        m_proxy.add("menu", "click", evtFuncs.menu);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        setData: function(menu, uri) {
            if (moduleName != menu.moduleName) {
                var theme = document.body.className;
                if(theme.indexOf('cloud-let') > -1 || theme.indexOf('cloud-hq') > -1 || theme.indexOf('cloud-my') > -1){
                    menu.theme = 'showIcon';
                }else{
                    menu.theme = 'not';
                }
                node.innerHTML = leftNavRender(menu);
                moduleName = menu.moduleName;
                lastMenuId = null;
                lastNode = null;
                that.fire("switchMenu", {type: "init"});
                defaultMax = document.body.offsetWidth;
                menuNodes = [].slice.call(node.querySelectorAll(".sub-menu,.small-menu,.smallx-menu"));
            }
            custFuncs.switchMenuByUri(uri);
        },
        switchMenu: function(menuId, self) {
            var menu = sizzle("[data-for=" + menuId + "]", node)[0];
            var scrollHeight = menu.scrollHeight;
            var icon = sizzle("[data-menu-id=" + menuId + "]", node)[0];
            var targetHeight = null;
            var childNodes = null;
            var child = null;
            if(menu){
                var top = closest(menu, ".sub-menu");
                if(top){
                    var prev = nodeOpera.prev(top);
                    var topId = prev.getAttribute("data-menu-id");
                    if(lastMenuId != null && lastMenuId != topId){
                        custFuncs.switchMenu(lastMenuId, lastNode);
                    }
                    if(lastMenuId != menuId){
                        lastMenuId = topId;
                        lastNode = prev;
                    }else{
                        lastMenuId = null;
                        lastNode = null;
                    }
                }
            }else{
                lastMenuId = null;
                lastNode = null;
            }
            if (menu.offsetHeight == 0) {
                // 收缩状态，这次应该展开
                className.add(sizzle(".icon-add", icon), "add-select");
                menu.setAttribute("data-switch", 1);
                self && className.add(self.parentNode, "parent-selected");
                while(menu != node) {
                    targetHeight = 0;
                    childNodes = nodeOpera.childNodes(menu);

                    while(child = childNodes.shift()) {
                        targetHeight += parseInt(child.getAttribute("data-height") || child.offsetHeight, 10);
                    }

                    menu.setAttribute("data-height", targetHeight);
                    menu.style.height = targetHeight + "px";

                    menu = closest(menu.parentNode, "menu");
                }
                that.fire("switchMenu", {type: "open"});
            } else if (menu.offsetHeight == menu.scrollHeight) {
                // 展开状态，这次应该收缩
                className.remove(sizzle(".icon-add", icon), "add-select");
                self && className.remove(self.parentNode, "parent-selected");
                menu.setAttribute("data-switch", 0);

                while(menu != node) {
                    menu.setAttribute("data-height", menu.offsetHeight - scrollHeight);
                    menu.style.height = (menu.offsetHeight - scrollHeight) + "px";
                    menu = closest(menu.parentNode, "menu");
                }
                that.fire("switchMenu", {type: "close"});
            } else if (menu.getAttribute("data-switch") == 0) {
                // 正在收缩，应该重新展开
                className.add(sizzle(".icon-add", icon), "add-select");
                menu.setAttribute("data-switch", 1);

                while(menu != node) {
                    targetHeight = parseInt(menu.getAttribute("data-height"), 10) + scrollHeight;
                    menu.setAttribute("data-height", targetHeight);
                    menu.style.height = targetHeight + "px";
                    menu = closest(menu.parentNode, "menu");
                }
                that.fire("switchMenu", {type: "open"});
            } else {
                // 正在展开，应该重新收缩
                className.remove(sizzle(".icon-add", icon), "add-select");
                menu.setAttribute("data-switch", 0);

                while(menu != node) {
                    targetHeight = parseInt(menu.getAttribute("data-height"), 10) - scrollHeight;
                    menu.setAttribute("data-height", targetHeight);
                    menu.style.height = targetHeight + "px";
                    menu = closest(menu.parentNode, "menu");
                }
                that.fire("switchMenu", {type: "close"});
            }
        },
        switchMenuByUri: function(uri) {
            try {
                var link = sizzle("[data-path=" + uri + "]", node)[0];
            }catch(ex) {
                console.error(ex);
                return;
            }

            if (link == null) {
                return;
            }

            var menu = closest(link.parentNode, "[data-for]");

            if (menu && menu.offsetHeight == 0) {
                custFuncs.switchMenu(menu.getAttribute("data-for"));
                className.add(closest(menu, ".menu-item"), "parent-selected");
            }

            var selectedLink = sizzle(".selected", node)[0];

            if (selectedLink) {
                className.remove(selectedLink, "selected");
            }

            storage.put(api.const.MENUID, link.getAttribute("data-id"));
            className.add(link, "selected");
        },
        hideMenu: function(){
            node.parentNode.style.display = "none";
        },
        showMenu: function(){
            node.parentNode.style.display = "block";
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 找到所有带有node-name的节点
        nodeList = parseModule(node);

        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;
    that.setData = custFuncs.setData;
    that.hideMenu = custFuncs.hideMenu;
    that.showMenu = custFuncs.showMenu;
    // that.switchMenuByUri = custFuncs.switchMenuByUri;

    return that;
};