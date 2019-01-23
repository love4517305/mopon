/**
 * @author benny.zheng
 * @data 2016-07-18
 * @description 顶部导航
 */
module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var addEvent = require("lib/evt/add");
    var getStyle = require("lib/dom/getStyle");
    var className = require("lib/dom/className");
    var sizzle = require("lib/dom/sizzle");
    var insertNode = require("lib/dom/insertNode");
    var stopPropagation = require("lib/evt/stopPropagation");
    var queryToJson = require("lib/json/queryToJson");
    var getPosition = require("lib/dom/getPosition");
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var moreMenu = require("./moreMenu"); // 更多
    var dialogManager = require("plugin/dialog/manager");
    var updatePwdDialog = require("./updatePwdDialog");
    var ajax = require("lib/io/ajax");
    var each = require("lib/util/each");
    var when = require("lib/util/when");
    var itemRender = require("./item.ejs");
    var insertHTML = require("lib/dom/insertHTML");
    var cinemaListDialog = require('plugin/module/cinemaListDialog');
    var cinemaLineListDialog = require('plugin/module/cinemaLineListDialog');
    var msgDetailDialog = require("./msgDetailDialog");
    var msgListDialog = require("./msgListDialog");
    var eventProxy = require("lib/evt/proxy");
    var msgManager = require("./msgManager");
    var getType = require("lib/util/getType");
    var msgLayerRender = require("./msgLayer.ejs");
    var toast = require("plugin/dialog/toast");
    var merge = require("lib/json/merge");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var itemWidth = 0; // 每一项的宽度
    var moreAt = -2; // 当前more所处的位置
    var m_moreMenu = null;
    var timerMove = null;
    var timer = null;
    var obj = null;
    var arrList = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        "resize": function(ev) {
            clearTimeout(timer);
            timer = setTimeout(function() {
                custFuncs.updateView();
            }, 50);
        },
        "showMore": function(ev) {
            stopPropagation(ev);
            nodeList.opera.style.height = nodeList.opera.scrollHeight + 'px';
        },
        hideMore: function(ev){
            stopPropagation(ev);
            nodeList.opera.style.removeProperty("height");
        },
        selectItem: function(e) {
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            className.remove(nodeList.item, "selected");
            className.add(elem, "selected");
        },
        updatePwd: function() {
            var m_updatePwdDialog = updatePwdDialog({
                hasClose: true,
                btns: [
                    { "id": "ok", "text": "更新", "type": "blue" },
                    { "id": "cancel", "text": "关闭" }
                ]
            });
            m_updatePwdDialog.show();
            m_updatePwdDialog.bind('suc', evtFuncs.updatePwdSuc);
        },
        updatePwdSuc: function(e) {
            top.location.href = "/login.html";
        },
        logout: function() {
            ajax({
                url: "/proxy/cloud/platform/logout",
                method: "post",
                onSuccess: function(res) {
                    if (res.code == 0) {
                        top.location.href = "/login.html";
                    } else {
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
        },
        openFrame: function() {

            top.location.href = "/frame.html#/derivatives/goodsManage/product/manage?text=" + encodeURIComponent("管理商品库存");
            framesDialog.reload("/derivatives/goodsManage/product/manage?text=" + encodeURIComponent("管理商品库存"));
        },
        enter: function(ev) {
            timerMove = setTimeout(function() {
                var type = ev.target.getAttribute("data-type");
                var showItem = nodeList[type];
                if (!showItem) return;
                if (type != "config") {
                    if (type == "saves") {
                        custFuncs.getSavesMsg()
                            .then(function(ev) {
                                if (ev.length != 0) {
                                    nodeList.savesItems.innerHTML = itemRender({ data: ev, type: "save" });
                                    className.add(nodeList.noSave, "hide");

                                } else {
                                    nodeList.savesItems.innerHTML = "";
                                    className.remove(nodeList.noSave, "hide");
                                }
                                className.add(showItem, "showItem");
                            });
                    }
                    else {
                        custFuncs.interval();
                        custFuncs.setMsgInfo();
                        className.add(showItem, "showItem");
                        // custFuncs.getMsg()
                        //     .then(function(ev) {
                        //         //if(ev.length != 0){
                        //         //    showItem.innerHTML = '<li class="tc hide" node-name="noSave">暂无信息！</li>';
                        //         //    insertHTML(showItem, itemRender({data: ev, type: "msgs"}), "afterbegin");
                        //         //    className.add(nodeList.noMsg, "hide");
                        //         //
                        //         //}else{
                        //         className.remove(nodeList.noMsg, "hide");
                        //         //}
                        //         className.add(showItem, "showItem");
                        //     });
                    }
                } 
                else {
                    showItem.style.right = ev.target.clientWidth/2 + "px"; 
                    className.add(showItem, "showItem");
                }
            }, 300);
        },
        out: function(ev) {
            clearTimeout(timerMove);
            var type = ev.target.getAttribute("data-type");
            var hideItem = nodeList[type];

            setTimeout(function() {
                className.remove(hideItem, "showItem");

            }, 300);
        },
        setCinema: function(e) {
            if (className.has(nodeList.setCinema, 'disable')) {
                return;
            }

            ajax({
                "url": "/proxy/base/site/control/v1/queryControlUserDataLevel",
                "method": 'POST',
                "onSuccess": function(res) {
                    if (res.code != 0) {
                        dialogManager.alert('数据权限获取失败' + res.msg);
                        return;
                    }

                    switch (res.data.dataLevel) {
                        case '2':
                            var dialog = cinemaLineListDialog({
                                data: res.data.records
                            });
                            dialog.show();
                            dialog.bind('chooseCinemaLine', evtFuncs.chooseCinema);
                            break;
                        case '3':
                            var dialog = cinemaListDialog({
                                data: res.data.records
                            });
                            dialog.show();
                            dialog.bind('chooseCinema', evtFuncs.chooseCinema);
                            break;
                    }
                },
                "onError": function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
        },
        chooseCinema: function(e) {
            e.data.result.cinemas = e.data.result.cinemas.join(',');
            ajax({
                "url": "/proxy/cloud/platform/setCinemas",
                "method": 'POST',
                "data": e.data.result,
                "onSuccess": function(res) {
                    if (res.code != 0) {
                        dialogManager.alert(res.msg);
                        return;
                    }

                    location.reload();
                },
                "onError": function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
        },
        viewMsg: function(ev) {
            var id = ev.data.id;
            var arrData = [];
            each(arrList, function(item){
                if(item.id == id){
                    arrData.push(item);
                    return
                }
            });
            obj = arrData[0];
            if (obj.type == "2") {
                var list = custFuncs.parseQueryString(obj.content);
                window.sessionStorage.removeItem("todoForm");
                window.sessionStorage.setItem("flowInstId", list.flowInstId);
                top.location.href = "/frame.html#" + obj.content;
            }
            else {
                msgManager.getMsgDetailById({"id": obj.id}).then( function(res) {
                    var dialog = msgDetailDialog({
                        data: obj
                    })
                    custFuncs.interval();
                    custFuncs.setMsgInfo();
                    dialog.show();
                })
            }
        },
        viewAllMsgs: function(ev) {
            top.location.href = "/frame.html#/mmc/msgMenu";
            top.framesManager.reload("/mmc/msgMenu")
        },
        readed: function(evt) {
            if (evt.data.msgInfo.readStatus == '未读') {
                custFuncs.setMsgInfo();
            }
        },
        deleteSaves: function(evt) {
            var id = evt.target.getAttribute("data-id");
            custFuncs.deleteSaves(id).then(function(){
                nodeList.savesItems.removeChild(evt.target.parentNode);
            });       
        },
        uriTo: function(evt) {
            var uri = evt.data.uri;
            var id = evt.target.getAttribute("data-id");
            var appId = evt.target.getAttribute("data-appId");
            var enabled = evt.target.getAttribute("data-enabled"); //判断是否失效地址
            if(enabled == 0) {
                dialogManager.confirm("收藏的地址已失效，是否删除？",function(evt){
                    custFuncs.deleteSaves(id).then(function(){
                        nodeList.savesItems.removeChild(evt.target.parentNode);
                    });
                });
            } else{
                // 用于获取的访问权限
                ajax({
                    "url": "/proxy/cloud/platform/getMenus?appId=" + appId,
                    "method": 'get',
                    "onSuccess": function(res) {
                        if (res.code == 0) {
                            if (getType(res.data) != "array" || res.data.length == 0) {
                               dialogManager.alert("权限已更新，暂无访问权限!"); 
                            } else {
                                top.location.href = "/frame.html#"+uri;
                            }                
                        }else {
                            dialogManager.alert("获取信息失败!"); 
                        }
                    },
                    "onError": function(req) {
                        console.error(runtime.getHttpErrorMessage(req));
                    }
                });
            }
        }
    };

    //-------------子模块实例化---------------
    var initMod = function() {
        if(opts.theme !== "cloud-ng") {
            m_moreMenu = moreMenu();
        }
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        if(opts.theme !== "cloud-ng"){
            addEvent(window, "resize", evtFuncs.resize);
            addEvent(nodeList.more, "mouseover", evtFuncs.showMore);
            addEvent(nodeList.navBox, "mouseleave", evtFuncs.hideMore);
            addEvent(nodeList.item, "click", evtFuncs.selectItem);
            addEvent(nodeList.updatePwd, "click", evtFuncs.updatePwd);
            addEvent(nodeList.logout, "click", evtFuncs.logout);
            addEvent(nodeList.hoverItem, "mouseenter", evtFuncs.enter);
            addEvent(nodeList.hoverItem, "mouseleave", evtFuncs.out);
            addEvent(nodeList.jump, 'click', evtFuncs.viewAllMsgs);
            addEvent(nodeList.setCinema, 'click', evtFuncs.setCinema);
            eventProxy(nodeList.msgs).add('viewMsg', 'click', evtFuncs.viewMsg);
            eventProxy(nodeList.savesItems).add('deleteSaves', 'click', evtFuncs.deleteSaves);
            eventProxy(nodeList.savesItems).add('uriTo', 'click', evtFuncs.uriTo);
            addEvent(nodeList.allMsgs, 'click', evtFuncs.viewAllMsgs);
        }

        // msgManager.bind('readed', evtFuncs.readed);
        // addEvent(nodeList.msgItems, 'click', evtFuncs.detil);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        "updateView": function() {
            className.add(nodeList.more, "hide");
            nodeList.opera.style.removeProperty("width");
            var dh = node.offsetHeight;
            var sh = nodeList.opera.scrollHeight;
            let bool = opts.theme === "cloud-let";
            if(sh !== dh){
                var w = nodeList.navBox.offsetWidth;
                var rw = w - (bool ? 95 : custFuncs.media(95, 120));
                var total = 0, stop = false;
                each(nodeList.item, function(dom){
                    var ow = dom.offsetWidth;
                    total += ow;
                    if(total > rw && !stop){
                        total -= ow;
                        stop = true;
                        return false;
                    }
                });
                nodeList.opera.style.width = total + 'px';
                className.remove(nodeList.more, "hide");
            }
        },
        setDefaultSelect: function() {
            custFuncs.setSelect(opts.moduleId);
        },
        setSelect: function(moduleId){
            if (moduleId) {
                var cur = sizzle("[data-id=" + moduleId + "]", opts.theme === "cloud-ng" ? node : nodeList.opera)[0];
                if (cur) {
                    className.remove(nodeList.item, "selected");
                    className.add(cur, "selected");
                }
            }
        },
        media: function(min, max){
            if(document.body.offsetWidth <= 1400){
                return min;
            }
            return max;
        },
        showHeader: function() {
            node.style.removeProperty("height");
            node.style.removeProperty("overflow");
        },
        hideHeader: function() {
            node.style.height = "0px";
            node.style.overflow = "hidden";
        },
        getSavesMsg: function() {
            var defer = when.defer();
            ajax({
                url: "proxy/cloud/platform/favorite/queryFavorite",
                method: "post",
                data: {params: JSON.stringify({appId:opts.moduleId})},
                onSuccess: function(res) {
                    if (res.code == 0) {
                        defer.resolve(res.data);
                    } else {
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        getMsgInfo: function() {
            var defer = when.defer();
            when.all([
                    msgManager.getTopMessage()
                ])
                .then(function(res) {
                    defer.resolve(res);
                }).otherwise(function() {
                    defer.reject("获取消息信息失败");
                });

            return defer.promise;
        },
        setMsgInfo: function() {
            custFuncs.getMsgInfo()
                .then(function(res) {
                    var msgList = res[0].data || [];
                    arrList = msgList;
                    msgList.forEach(function(item){
                        item.oldTime = item.sendTime;
                        item.sendTime = (item.sendTime.split(/\s/g))[0];
                    })
                    // debugger;
                    nodeList.msgItems.innerHTML = msgLayerRender({ "msgList": msgList, type: "msgs" });
                    if (msgList.length > 0) {
                        className.add(nodeList.noMsg, "hide");
                    } else {
                        className.remove(nodeList.noMsg, "hide");
                    }
                    var aLi = sizzle(".setRed");
                    for (var i = 0; i < aLi.length; i++) {
                        if (aLi[i].getAttribute('data-type') == '2') {
                            aLi[i].getElementsByTagName('p')[0].style.color = "#ff0000";
                        }
                    }
                });
        },
        interval: function(){
            msgManager.countMessage().then(function(res){
               var num = (res.data || 0).replace( /\+/, '' );
               var oldNum = res.data || 0;
                nodeList.msgNum.innerHTML = oldNum;
                if (num > 0) {
                    className.remove(nodeList.msgNum, "hide");
                } else {
                    className.add(nodeList.msgNum, "hide");
                }
            })
        },
        msgInterval: function(){
            setInterval(custFuncs.interval, 100000)
        },
        getCinemaData: function() {
            ajax({
                "url": "/proxy/cloud/platform/getDefaultCinemas",
                "method": 'POST',
                "onSuccess": function(res) {
                    if (res.code != 0) {
                        dialogManager.alert(res.msg);
                        return;
                    }

                    var name;
                    if (res.data) {
                        name = res.data.dataOrgName || '无常用影院数据';
                        if (res.data.dataLevelType == '2') {
                            className.add(nodeList.setCinema, 'disable');
                        }
                        runtime.setCinemaInfo(res.data);
                    } else {
                        name = '无常用影院数据';
                    }

                    name = name.length > 10 ? (name.slice(0, 9) + '...') : name;
                    nodeList.settingCinemaName.innerHTML = name;
                },
                "onError": function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            })
        },
        deleteSaves: function(data) {
            var defer = when.defer();
            ajax({
                url: "proxy/cloud/platform/favorite/deleteFavorite",
                method: "post",
                data: {params: JSON.stringify({id: data})},
                onSuccess: function(res) {
                    if (res.code == 0) {
                        toast("删除成功！").show();
                        defer.resolve();
                    } else {
                        defer.reject();
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        parseQueryString: function (url){
            var obj = {};
            var start = url.indexOf("?")+1;
            var str = url.substr(start);
            var arr = str.split("&");
            for(var i = 0 ;i < arr.length;i++){
                var arr2 = arr[i].split("=");
                obj[arr2[0]] = arr2[1];
            }
            return obj;
        }


    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 找到所有带有node-name的节点
        nodeList = parseModule(node);
        if(opts.theme !== "cloud-ng"){
            nodeList.item = [].concat(nodeList.item);
        }
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();

        if(opts.theme !== "cloud-ng") {
            custFuncs.setDefaultSelect();
            custFuncs.getCinemaData(); // 获取用户设置的影院数据权限

            itemWidth = nodeList.more.offsetWidth;
            moreAt = nodeList.item.length;
            custFuncs.updateView();

            // 新需求：有消息模块才初始化消息气泡
            var hasMsgMod = false;
            each(opts.moduleList, function (item) {
                if (item.code === 'mmc') {
                    hasMsgMod = true;
                    return false;
                }
            });
            if (hasMsgMod) {
                custFuncs.setMsgInfo();  //设置消息信息
                custFuncs.interval();
                custFuncs.msgInterval();
            }
        }else{

        }
    }

    //---------------暴露API----------------
    that.init = init;
    that.showHeader = custFuncs.showHeader;
    that.hideHeader = custFuncs.hideHeader;
    that.setSelect = custFuncs.setSelect;
    that.updatePwd = evtFuncs.updatePwd;
    that.logout = evtFuncs.logout;

    return that;
};
