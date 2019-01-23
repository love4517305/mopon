/**
tab选择卡 by-璩
 */
module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var eventProxy = require("lib/evt/proxy");
    var opra = require("lib/dom/node");
    var each = require("lib/util/each");
    var setStyle = require("lib/dom/setStyle");
    var stopPropagation = require("lib/evt/stopPropagation");
    var className = require("lib/dom/className");
    var getType = require("lib/util/getType");
    var insertHTML = require("lib/dom/insertHTML");
    var insertNode = require("lib/dom/insertNode");
    var addEvent = require("lib/evt/add");
    var render = require("./tabItem.ejs");
    var sizzle = require("lib/dom/sizzle");
    var ajax = require("lib/io/ajax");
    var dialogManager = require("plugin/dialog/manager");
    var vueManager =  require('vs/plugin/dialog').default;
    var toast = require("plugin/dialog/toast");
    var setTicket = require("root/common/frame/SetTicket.vue").default;

    //-----------声明模块全局变量-------------
    opts = opts || {};
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var lastNode = null;
    var map = {};
    var moduleId = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        tabItemSelect: function(evt) {
            var self = evt.target;
            var key = self.getAttribute("data-key");
            if (self.parentNode.getAttribute("data-type") == "more") {
                insertNode(nodeList.tabItems, self, "afterbegin");
                custFuncs.overflow();
            }

            custFuncs.setTabIndex(key);
        },
        tabItemClose: function(evt) {
            stopPropagation(evt.event);
            var moreItems = sizzle("[data-action=item]", node);

            if (moreItems.length == 1) {
                dialogManager.alert("无法关闭最后一个页面标签");
                return;
            }

            var parent = evt.target.parentNode;

            custFuncs.closeTab(parent);

            custFuncs.overflow();

            if (lastNode != parent) {
                var key = lastNode.getAttribute("data-key");
                custFuncs.setTabIndex(key);
            }

            return -1;
        },
        fullScreen: function(e) {
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            var type = elem.getAttribute("data-type");
            if(type == "full"){
                elem.setAttribute("data-type", "restore");
                className.add(elem, "restore");
                elem.title = "还原";
            }else{
                elem.setAttribute("data-type", "full");
                elem.title = "全屏";
                className.remove(elem, "restore");
            }
            that.fire("fullscreen", {
                type: type
            });
        },
        resize: function(){
            custFuncs.overflow();
        },
        updatePwd: function(){
            that.fire("updatePwd");
        },
        logout: function(){
            that.fire("logout");
        },
        clientConfig: function(){
            if(!window.aidaShell){
                vueManager.error("无法读取客户端配置！");
                return;
            }
            const self = this;
            let lists = {};
            lists.printList = [];
            lists.readerList = [];
            lists.portList = [];
            let res = {};
            aidaShell.registerCallBack("getSerialPortCallback", function (status, err, data) {
                if(status === 0){
                    JSON.parse(data).forEach(item => {
                        lists.portList.push({key: item.SerialPortNo, val: item.SerialPortName});
                    })
                }
                aidaShell.getCardReaderList("getCardReaderCallback");
                aidaShell.cancelCallBack("getSerialPortCallback");
            });
            aidaShell.registerCallBack("getCardReaderCallback", function (status, err, data) {
                if(status === 0){
                    JSON.parse(data).forEach(item => {
                        lists.readerList.push({key: item.CardReaderCode, val: item.CardReaderName});
                    })
                }
                custFuncs.selectTicket(lists, res)
                aidaShell.cancelCallBack("getCardReaderCallback");
            });

            aidaShell.registerCallBack("getPrinterCallback", (status, err, data) => {
                if(status === 0){
                    JSON.parse(data).forEach(item => {
                        lists.printList.push({key: item.PrinterCode, val: item.PrinterName});
                    });
                    aidaShell.registerCallBack("readFromFileCallback", (status, err, data) => {
                        if(status === 0 && data){
                            res = JSON.parse(data);
                        }
                        aidaShell.getSerialPortList("getSerialPortCallback");
                        aidaShell.cancelCallBack("readFromFileCallback");
                    });

                    aidaShell.readDataFromFile("readFromFileCallback");


                }else{
                    dialogManager.error(err);
                }

            });
            aidaShell.getPrinterList("getPrinterCallback");



            // aidaShell.registerCallBack("getPrinterCallback", (status, err, data) => {
            //     if(status === 0){
            //         let printList = [];
            //         JSON.parse(data).forEach(item => {
            //             printList.push({key: item.PrinterCode, val: item.PrinterName});
            //         });
            //         aidaShell.registerCallBack("readFromFileCallback", (status, err, data) => {
            //             let res = {};
            //             if(status === 0 && data){
            //                 res = JSON.parse(data);
            //             }
            //             custFuncs.selectTicket(printList, res);
            //             aidaShell.cancelCallBack("readFromFileCallback");
            //         });

            //         aidaShell.readDataFromFile("readFromFileCallback");


            //     }else{
            //         vueManager.error(err);
            //     }

            // });
            aidaShell.getPrinterList("getPrinterCallback");
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        var tabItemsProxy = eventProxy(node);
        tabItemsProxy.add("close", "click", evtFuncs.tabItemClose);
        tabItemsProxy.add("item", "click", evtFuncs.tabItemSelect);
        addEvent(nodeList.fullScreen, "click", evtFuncs.fullScreen);
        addEvent(window, "resize", evtFuncs.resize);
        addEvent(nodeList.updatePwd, "click", evtFuncs.updatePwd);
        addEvent(nodeList.logout, "click", evtFuncs.logout);
        addEvent(nodeList.clientConfig, "click", evtFuncs.clientConfig);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        selectTicket: function(lists, defaultConfig){
            let dialog = vueManager.dialog(setTicket, {
                title: "客户端配置",
                lists: lists,
                defaultConfig: defaultConfig || {},
                buts: [{text: "确定", id: "ok", type: "blue"}, {text: "取消", id: "cancel"}]
            });
            dialog.show();
            dialog.bind("ok", () => {
                dialog.postMessage({});
            });
            dialog.bind("cancel", () => {
                dialog.hide(dialog.destroy);
            });
            dialog.bind("message", opt => {
                aidaShell.registerCallBack("saveToFileCallback", function (status, err) {
                    if(status !== 0){
                        vueManager.error("saveToFileCallback: " + status + " # " + err);
                    }
                    aidaShell.cancelCallBack("saveToFileCallback");
                });
                // console.log(opt);
                aidaShell.saveDataToFile("saveToFileCallback", JSON.stringify(opt));
                dialog.hide(dialog.destroy);
                vueManager.success("配置成功！");
            });
        },
        closeTabByUrl: function(url){
            var result = custFuncs.getItems();
            var count = result.keys.length;
            var curKey = lastNode.getAttribute("data-key");
            var delKey = "/proxy.html#" + url;

            if (count == 1) {
                dialogManager.alert("无法关闭最后一个页面标签");
                return;
            }
            each(result.keys, function(key){
                if(result.items[key] && delKey == key){
                    custFuncs.closeTab(result.items[key]);
                    custFuncs.overflow();
                    if(curKey != delKey){
                        custFuncs.setTabIndex(curKey);
                    }
                    return false;
                }
            });
        },
        closeTab: function(node){
            if (className.has(node, "checked")) {
                setTimeout(function() {
                    custFuncs.setTabIndex();
                }, 80);
            }
            var key = node.getAttribute("data-key");
            delete map[moduleId][key];
            node.parentNode.removeChild(node);
            that.fire("close", { key: key });
        },
        overflow: function() { //判断是否溢出
            var moreItems = opra.childNodes(nodeList.moreItems);
            if (moreItems.length > 0) {
                each(moreItems, function(dom) {
                    insertNode(nodeList.tabItems, dom, "beforeend");
                });
            }
            var tabItems = opra.childNodes(nodeList.tabItems);
            var len = 0,
                w = nodeList.tabItems.offsetWidth,
                more = false;
            each(tabItems, function(dom) {
                len += dom.offsetWidth;
                if (len > w) {
                    insertNode(nodeList.moreItems, dom, "beforeend");
                    more = true;
                }
            });

            if (more) {
                className.remove(nodeList.tabMore, "hide");
            } else {
                className.add(nodeList.tabMore, "hide");
            }

            if (tabItems.length) {
                nodeList.line.style.display = "block";
            } else {
                nodeList.line.style.display = "none";
            }
        },
        checked: function(node, len) {
            if (!node) {
                nodeList.line.style.display = "none";
                return;
            }
            if (lastNode) className.remove(lastNode, "checked");
            className.add(node, "checked");
            lastNode = node;
            var w = node.offsetWidth;
            setStyle(nodeList.line, {
                left: len + 20 + "px",
                width: (w - 45) + "px"
            });
            var key = node.getAttribute("data-key");
            that.fire("select", { key: key });
        },
        setTabIndex: function(key) { //直接选择一项
            var tab = custFuncs.getTabIndex(key);
            custFuncs.checked(tab.node, tab.len);
        },
        createTabHTML: function(id){
            if(map[id]){
                each(map[id], function(val, key){
                    insertHTML(nodeList.tabItems, render({key: key, val: val, moduleId: id }), "afterbegin");
                });
            }
        },
        addTab: function(data) { //添加选项卡
            if(moduleId != null && data.moduleId != moduleId){
                nodeList.tabItems.innerHTML = "";

                custFuncs.createTabHTML(data.moduleId);
            }
            moduleId = data.moduleId;
            if(!map[moduleId]) map[moduleId] = {};
            if(!map[moduleId][data.key]){
                map[moduleId][data.key] = data.val;
                insertHTML(nodeList.tabItems, render(data), "afterbegin");
                custFuncs.setTabIndex(data.key);
                custFuncs.overflow();
            }else{
                custFuncs.setTabIndex(data.key);
            }
        },
        getItems: function(){
            var items = {};
            var keys = [];
            var moreItems = opra.childNodes(nodeList.moreItems);
            var tabItems = opra.childNodes(nodeList.tabItems);
            each(tabItems.concat(moreItems), function(dom) {
                var key = dom.getAttribute("data-key");
                items[key] = dom;
                keys.push(key);
            });
            return {items: items, keys: keys};
        },
        filterTab: function(type, self){
            var result = custFuncs.getItems();
            var count = result.keys.length;
            var curKey = self.getAttribute("data-key");
            var curAppId = self.getAttribute("data-id");

            if(type != "save"){
                if (count == 1) {
                    dialogManager.alert("无法关闭最后一个页面标签");
                    return;
                }
                if(type == "cur"){
                    custFuncs.closeTab(self);
                    custFuncs.overflow();
                    custFuncs.setTabIndex();
                }else if(type == "other"){
                    each(result.keys, function(key){
                        if(result.items[key] && curKey != key){
                            custFuncs.closeTab(result.items[key]);
                        }
                    });
                    custFuncs.overflow();
                    custFuncs.setTabIndex();
                }else if(type == "left"){
                    each(result.keys, function(key){
                        if(curKey == key){
                            return false;
                        }
                        if(result.items[key]){
                            custFuncs.closeTab(result.items[key]);
                        }
                    });
                    custFuncs.overflow();
                    custFuncs.setTabIndex(curKey);
                }else if(type == "right"){
                    var flat = false;
                    each(result.keys, function(key){
                        if(flat){
                            if(result.items[key]){
                                custFuncs.closeTab(result.items[key]);
                            }
                        }
                        if(curKey == key){
                            flat = true;
                        }
                    });
                    custFuncs.overflow();
                    custFuncs.setTabIndex(curKey);
                }
            }else{
                if(curKey.lastIndexOf("defaultPage/index") != -1 || curKey.indexOf("?") != -1 ){
                    return toast("该页面不支持收藏!").show();
                }
                curKey = curKey.slice(curKey.indexOf("#")+1); 
                custFuncs.saveCollection(curAppId, curKey);
            }

        },
        saveCollection: function(curAppId, curKey){
            ajax({
                url: "/proxy/cloud/platform/favorite/validateExist",
                method: "post",
                data: {params: JSON.stringify({"appId": curAppId,"uri":curKey})},
                onSuccess: function(res){
                    if(res.code == 0){
                        toast(res.msg).show();
                    }else {
                        toast(res.msg).show();    
                    }
                },
                onError: function(req){
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
        },
        getTabIndex: function(key) {
            var tabItems = opra.childNodes(nodeList.tabItems);
            var self = null,
                len = 0;
            each(tabItems, function(dom) {
                var v = dom.getAttribute("data-key");
                var w = dom.offsetWidth;
                if (v == key || (getType(key) == "undefined") && dom) {
                    self = dom;
                    return false;
                }
                len += w;
            });
            return { node: self, len: len };
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
        custFuncs.overflow();
    }

    //---------------暴露API----------------
    that.init = init;
    that.addTab = custFuncs.addTab; //添加选项
    that.filterTab = custFuncs.filterTab;
    that.closeTabByUrl = custFuncs.closeTabByUrl;

    return that;
};
