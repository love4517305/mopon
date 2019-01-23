/**
 * @author benny.zheng
 * @data 2016-06-06
 * @description 本文件用于方便复制粘贴入口文件之用，请更新这里的说明
 *              另外，考虑到一般是放在js/src/pages/page-name/main.js，因此使用../../
 *              如果不是这个目录，请更改成正确的相对路径
 */
//----------------require--------------

var base = require("lib/comp/base"); // 基础对象
var parsePage = require("lib/dom/parsePage"); // 页面模块自动解析
var when = require("lib/util/when");
var each = require("lib/util/each");
var jsonToQuery = require("lib/json/jsonToQuery");
var queryToJson = require("lib/json/queryToJson");
var className = require("lib/dom/className");
var merge = require("lib/json/merge");
var isEmpty = require("lib/str/isEmpty");
var URL = require("lib/util/URL");
var scss = require("./main.scss"); // 引入当前页面的scss文件
var runtime = require("plugin/runtime"); // 运行时相关代码
var appendQuery = require("lib/str/appendQuery");
var pathManager = require("./pathManager");
var ajax = require("lib/io/ajax");
var header = require("./header");
var leftNav = require("./leftNav");
var addEvent = require("lib/evt/add");
var menu = require("plugin/module/contextMenu");
var frames = require("./frames");
var pathMap = require("plugin/pathMap.json");
var theme = require("plugin/theme/main");
(require("vs/plugin/dialog/manager").default).init(theme);
var dialogManager = require("plugin/dialog/manager");
var pageService = require("plugin/util/pageService");
var getType = require("lib/util/getType");
var plugins = require("mopon/plugins");
var sizzle = require("lib/dom/sizzle");
var opra = require("lib/dom/node");
var tab = require("./tab");
var simScroll = require("plugin/module/simScroll");
var registerVue = require("vs/plugin/register");
var polingPost = require("./polingPost");
var feedbackDialog = require("./feedbackDialog");

// 模板
var render = require("./main.ejs"); // 页面总模板

//-----------声明模块全局变量-------------
var nodeList = null; // 存 储所有id符合m-xxx的节点
var opts = null;
var m_header = null;
var m_leftNav = null;
var m_tab = null;
var m_menu = null;
var m_frames = null;
var moduleList = null;
var menuList = null;
var moduleId = null;
var menuPathHash = null;
var moduleName = null;
var moduleHomeURL = null;
var moduleHomeText = null;
var path = null;
var hash = null;
var firstUri = null;
var menuCache = {};
var user = null;
var that = {};
var m_simScroll = null;
var p_timer = null;
var m_polingPost = null;
var helpUrl = null;//帮助中心链接
var helpConfig = {};
var m_feedbackDialog = null;

//-------------事件响应声明---------------
var evtFuncs = {
    "hashchange": function(ev) {
        path = ev.data[0];
        hash = ev.data[1];
        custFuncs.updateView();
    },
    selectMenu: function(ev){
        m_tab.filterTab(ev.data.type, ev.data.node);
    },
    "closeTab": function(ev) {
        var url = ev.data.key;
        pageService.destroy(url);
        m_frames.removeFrame(url);
    },
    "selectTab": function(ev) {
        var url = null;
        if (ev.data.key != moduleHomeURL) {            
            hash = URL.parse(ev.data.key).hash;
            if(theme == 'cloud-let' || theme == 'default') custFuncs.queryHelp(hash);
            hash = (hash.charAt(0) != "#") ? '#' + hash : hash;
            url = URL.parse(hash);
            location.href = "/frame.html#" + url.hash;
        } else {
            location.href = "/frame.html#" + moduleHomeURL;
        }
    },
    fullScreen: function(evt){
        if(evt.data.type == "full"){
            m_header.hideHeader();
            m_leftNav.hideMenu();
            nodeList.main.style.top = "0px";
            nodeList.main.style.paddingLeft = "0px";
        }else{
            m_header.showHeader();
            m_leftNav.showMenu();
            nodeList.main.removeAttribute("style");
        }
    },
    switchMenu: function(){
        var count = 0;
        clearInterval(p_timer);
        p_timer = setInterval(function(){
            m_simScroll.setOptions({
                horizontal: {
                    top: theme === 'cloud-ng' ? 43 : 0,
                    left: nodeList.layoutNav.offsetWidth - 18
                }
            });
            m_simScroll.loadScroll();
            if(count >= 520){
                clearInterval(p_timer);
                return;
            }
            count += 50;
        }, 50);
    },
    scrollRight: function(ev) {
        if(ev.data.suc){
            nodeList.leftNav.classList.add("scroll");
        }else{
            nodeList.leftNav.classList.remove("scroll");
        }
    },
    updatePwd: function(){
        m_header.updatePwd();
    },
    logout: function(){
        m_header.logout();
    },
    closeMenu: function(){
        var self = nodeList.closeMenu;
        if(self.dataset.type == 1){
            self.dataset.type = 0;
            self.classList.add("opened");
            m_leftNav.hideMenu();
            nodeList.main.style.top = "0px";
            nodeList.main.style.paddingLeft = "0px";
        }else{
            self.dataset.type = 1;
            self.classList.remove("opened");
            m_leftNav.showMenu();
            nodeList.main.removeAttribute("style");
        }
        m_simScroll.loadScroll();
    },
    toHelp(){
        if(!helpUrl){
            window.open(helpConfig.url);
        }else {
            window.open(`${helpUrl}?show_page=${path}`)
        }
    },
    feedback(){
        var m_feedbackDialog = feedbackDialog({});
        m_feedbackDialog.show();
        m_feedbackDialog.bind();
    },
    chat: function(e) {
        console.log(e);
        // top.location.href = "mqqwpa://im/chat?chat_type=wpa&uin=137804454&version=1&src_type=web&web_src=oicqzone.com";
    }
}

//-------------子模块实例化---------------
var initMod = function() {

    if(!(theme === 'cloud-ng')) {
        m_polingPost = polingPost(opts);
        m_polingPost.init();
    }

    m_header = header(theme === 'cloud-ng' ? nodeList.leftModule : nodeList.header, {
        moduleId: moduleId,
        moduleList: moduleList,
        theme: theme
    });
    m_header.init();

    m_leftNav = leftNav(nodeList.leftNav);
    m_leftNav.init();

    m_tab = tab(nodeList.tab);
    m_tab.init();

    m_simScroll = simScroll(nodeList.layoutNav, {
        horizontal: {
            left: nodeList.layoutNav.offsetWidth - 18
        }
    });
    m_simScroll.init();

    m_menu = menu(nodeList.tab, {
        action: "item",
        items: [
            { text: '收藏当前选项', id: "save"},
            { text: '关闭当前选项', id: "cur"},
            { text: '关闭非当前选项', id: "other"},
            { text: '关闭左边所有', id: "left"},
            { text: '关闭右边所有', id: "right"}
        ]
    });
    m_menu.init();

    m_frames = frames(nodeList.frames, {theme: theme});
    m_frames.init();
}

//-------------绑定事件------------------
var bindEvents = function() {
    m_tab.bind("close", evtFuncs.closeTab);
    m_tab.bind("select", evtFuncs.selectTab);
    m_tab.bind("fullscreen", evtFuncs.fullScreen);
    m_tab.bind("logout", evtFuncs.logout);
    m_tab.bind("updatePwd", evtFuncs.updatePwd);
    m_menu.bind("click", evtFuncs.selectMenu);
    m_leftNav.bind("switchMenu", evtFuncs.switchMenu);
    addEvent(window, "resize", evtFuncs.switchMenu);
    addEvent(nodeList.closeMenu, "click", evtFuncs.closeMenu);
    m_simScroll.bind("right", evtFuncs.scrollRight);

    nodeList.chat && addEvent(nodeList.chat, "click", evtFuncs.chat);
}

//-------------自定义函数----------------
var custFuncs = {
    /*******
     * url
     * url:/report/cinemaSettleReport
     * @param url
     */
    closeTabByUrl: function(url){
        m_tab.closeTabByUrl(url);
    },
    /**
     * 当hash改变时进入这里，页面加载时也会触发第一次改变
     */
    updateView: function() {
        //清除弹框
        var list = sizzle(".m-dialog-common");
        each(list, function(item){
            var prev = opra.prev(item);
            if(prev.nodeName.toLowerCase() == "div"){
                document.body.removeChild(prev);
                document.body.removeChild(item);
            }
        });
        var moduleArray = path.split("/");
        var newModuleName = moduleArray[1];

        //if (!(newModuleName in pathMap)) {
        //    dialogManager.alert("您还未登录", function() {
        //        location.href = "/login.html"
        //    });
        //}

        if (moduleList == null) {
            moduleName = newModuleName;
            custFuncs.getModuleList()
            .then(custFuncs.checkModule)
            .then(custFuncs.getMenuList)
            .then(custFuncs.initPage)
            .then(custFuncs.openPage)
            .then(plugins.loadUEditor)
            .then(plugins.loadECharts)
            .otherwise(custFuncs.errorHandler);
        } else {
            if (newModuleName == moduleName) {
                custFuncs.openPage()
                    .otherwise(custFuncs.errorHandler);
                return;
            }

            moduleName = newModuleName;
            custFuncs.checkModule()
                .then(custFuncs.getMenuList)
                .then(custFuncs.openPage)
                .otherwise(custFuncs.errorHandler);
        }

    },
    /**
     * 检查模块是否存在
     */
    checkModule: function() {
        var defer = when.defer();
        var hasModule = false;

        for (var i = 0; i < moduleList.length; i++) {
            if ((moduleList[i]['flag'] + "").toLowerCase() == moduleName.toLowerCase()) {
                hasModule = true;
                moduleId = moduleList[i]["id"];
                moduleHomeURL = "/" + moduleName + "/home";
                moduleHomeText = moduleList[i]["text"];
                break;
            }
        }

        if (!hasModule) {
            defer.reject("URL配置出错！");
            return defer.promise;
        }

        defer.resolve();
        return defer.promise;
    },
    /**
     * 从服务器获取模块列表
     */
    getModuleList: function() {
        var defer = when.defer();

        ajax({
            "url": "/proxy/cloud/platform/navigation",
            "method": "get",
            "onSuccess": function(res) {
                if (res.code != 0) {
                    alert(res.msg);
                    window.location = "/login.html";
                    defer.reject(res.msg);
                    return;
                }

                // 与pathMap合并
                moduleList = [];

                var revPathMap = {};

                each(pathMap, function(item, key) {
                    revPathMap[item["text"]] = {
                        "home": item.home,
                        "flag": key,
                        "text": item.text,
                        "adText": item.adText
                    };
                });
                each(res["data"], function(item, key) {
                    moduleList.push(merge(item, revPathMap[item['text'] || item['name']]));
                    moduleId = item.id;
                });

                defer.resolve();
            },
            "onError": function(req) {
                defer.reject(runtime.getHttpErrorMessage(req))
            }
        });

        return defer.promise;
    },
    /**
     * 从服务器获取菜单列表
     */
    getMenuList: function() {
        var defer = when.defer();

        if (moduleName in menuCache) {
            menuList = menuCache[moduleName]["list"];
            menuPathHash = menuCache[moduleName]["hash"];
            defer.resolve();
        } else {
            var loadMenu = function(json){
                ajax({
                    "url": "/proxy/cloud/platform/" + (theme === 'cloud-ng' ? "getMenus?appId=" : "getmenus?appid=") + moduleId,
                    "method": "get",
                    "onSuccess": function(res) {
                        if (res.code != 0) {
                            defer.reject(res.msg);
                            return;
                        }

                        if (getType(res.data) != "array" || res.data.length == 0) {
                            if(theme === 'cloud-ng') {
                                dialogManager.alert("当前模块没有权限防问！");
                            } else {
                                dialogManager.alert("当前模块没有权限防问！", function(){
                                    top.location = "/nav.html";
                                });
                            }

                            return;
                        }

                        var basePath = "/" + moduleName;
                        var menuPHash = {};
                        menuList = [];
                        menuPathHash = {};

                        var setMobile = function(res){
                            if(/^\/(\w+)\/(.*\w)/.test(res.uri)){
                                var mod = RegExp.$1;
                                var child = RegExp.$2.split('/')[0];
                                if(json[mod] && json[mod][child]){
                                    res.mobile = true;
                                    res.uri = appendQuery(res.uri, {
                                        appid: res.appid,
                                        ver: new Date().getTime()
                                    });
                                }
                            }
                            if(res.list){
                                each(res.list, function(item){
                                    setMobile(item);
                                });
                            }
                        };

                        each(res["data"], function(item) {
                            var key = theme === 'cloud-ng' ? "pId" : "pid";
                            if (menuPHash[item[key]] == null) {
                                menuPHash[item[key]] = [];
                            }
                            if(json){
                                setMobile(item);
                            }
                            menuPHash[item[key]].push(item);
                        });

                        menuList = menuPHash["0"];
                        custFuncs.traverseMenuList(menuList, menuPHash, basePath);

                        menuCache[moduleName] = {
                            "list": menuList,
                            "hash": menuPathHash
                        }
                        defer.resolve();
                    },
                    "onError": function(req) {
                        // console.(runtime.getHttpErrorMessage(req));
                        defer.reject(runtime.getHttpErrorMessage(req))
                    }
                });
            }

            if(!!navigator.userAgent.match(/AppleWebKit.*Mobile.*/)){
                runtime.childModule()
                    .then(function(res){
                        var json = null;
                        if(res.mobile && theme !== 'cloud-ng'){
                            json = {};
                            each(res.mobile, function(item, key){
                                if(!json[key]){
                                    json[key] = {};
                                }
                                each(item, function(v){
                                    json[key][v] = true;
                                });
                            });
                        }
                        loadMenu(json);
                    }).otherwise(function(){
                });
            }else{
                loadMenu();
            }
        }

        return defer.promise;
    },
    /**
     * 递归整理数据
     */
    traverseMenuList: function(list, menuPHash, basePath) {
        if(!list) {
            dialogManager.alert("数据出错!");
            return;
        }
        var item = null;

        for (var i = 0; i < list.length; i++) {
            item = list[i];
            menuPathHash[item.uri] = item;

            if (menuPHash[item["id"]]) {
                item["list"] = menuPHash[item["id"]];
                custFuncs.traverseMenuList(item["list"], menuPHash, item.path);
            }
        }
    },
    /**
     * 当数据就绪，从这里开始
     */
    initPage: function() {
        var defer = when.defer();

        // 先将HTML插入body
        document.body.insertAdjacentHTML('AfterBegin', render({
            "moduleList": moduleList,
            "menuList": menuList,
            "moduleName": moduleName,
            "theme": theme,
            // "user": { name: user.name }//user
            "user": user    //user
        }));

        // 找到所有带有id的节点，并将m-xxx-xxx转化成xxxXxx格式存储到nodeList中
        nodeList = parsePage();
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();

        evtFuncs.switchMenu();

        defer.resolve();
        return defer.promise;
    },
    /**
     * 打开页面
     */
    openPage: function() {
        var defer = when.defer();
        var url = null;
        var name = null;
        var paths = null;
        var item = null;
        var uri = null;
        var hashObj = null;
        url = "/proxy.html#" + path;        

        if (!isEmpty(hash)) {
            url += "?" + hash;
        }
        if (path == moduleHomeURL) {
            name = moduleHomeText;
            uri = "/home";
        } else {
            paths = path.split("/").slice(2);
            item = menuPathHash[path];

            if (item != null) {
                name = item.text;
                uri = item.uri;
            } else {
                uri = "/" + paths.join("/");

                try {
                    hashObj = queryToJson(hash);
                    name = isEmpty(hashObj.text) ? "首页" : hashObj.text;
                } catch(ex) {
                    console.error("必须为hash提供title参数");
                    name = "首页";
                }
            }
        }

        //firstUri = null;
        //var result = custFuncs.matchMenu(menuList, path);
        //if(!result){
        //    url = "/proxy.html#" + firstUri;
        //}
        m_header.setSelect(moduleId);
        // 在右侧显示这个
        m_tab.addTab({key: url, val: name, moduleId: moduleId});
        m_frames.addFrame(url, moduleId);

        m_leftNav.setData({
            menuList: menuList,
            moduleName: moduleName
        }, uri);


        //百度页面访问pv上报统计、同时以自定义事件方式上报
        try {
            if(window._hmt) {
                var moduleText = null;
                var subModuleText = menuPathHash[path]? menuPathHash[path].text : null;
                each(moduleList, function(v, k){
                    if(v.code == moduleName) {
                        moduleText = v.text;
                        return false;
                    }
                })
                var trackURL = "/frame.html#" + path;
                moduleText && (trackURL += '?' + moduleText);
                subModuleText && (trackURL += '-' + subModuleText);

                _hmt.push(['_setAutoPageview', false]);
                _hmt.push(['_trackPageview', trackURL]);            

                moduleText && subModuleText && _hmt.push(['_trackEvent', moduleText, 'page', subModuleText]);
            }
        } catch (e) {

        }
        

        defer.resolve();
        return defer.promise;
    },
    matchMenu: function(data, url){
        var result = false;
        each(data, function(v, k){
            if(getType(v) == "object" || getType(v) == "array"){
                result = custFuncs.matchMenu(v, url);
            }else{
                if(firstUri == null && k == "uri"){
                    firstUri = v;
                }
                if(url == v){
                    result = true;
                    return false;
                }
            }
        });
        return result;
    },
    /**
     * 当页面加载出错时统一调用
     */
    errorHandler: function(msg) {
        dialogManager.alert(msg);
    },
    hasFrame: function(url) {
        return m_frames.hasFrame("/proxy.html#" + url);
    },
    reloadFrame: function(url) {
        return m_frames.reloadFrame("/proxy.html#" + url);
    },
    closeFrame: function(url){
        return m_frames.removeFrame("/proxy.html#" + url);
    },
    createScript: function(url){
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    },
    /**
     * 从配置文件读取地址
     */
    queryHeplUrl: function() {
        ajax({
            "url": "/common/config/help-url.json",
            "method": "get",
            "onSuccess": function(res) {
                helpConfig = res;
            }
        });
    },
    /**
     * 从服务器查询页面是否配置帮助中心
     */
    queryHelp: function(show_page) {
        ajax({
            "url": "/proxy/dyadmin/dyadmin/adminapi/web/article/listarticle",
            "method": "post",
            data: { pagination: JSON.stringify({
                queryParams: {show_page: show_page||path},
                pageNumber:1,
                pageSize: 1,
            }) },
            "onSuccess": function(res) {
                if (res.code != 0) {
                    dialogManager.alert(res.msg);
                    window.location = "/login.html";
                    return;
                }
                if(!nodeList) nodeList = parsePage();

                if(res.data && res.data.records.length > 0){
                    // className.remove(nodeList.fixright, 'hide');
                    addEvent(nodeList.tohelp, "click", evtFuncs.toHelp);
                    addEvent(nodeList.feedback, "click", evtFuncs.feedback);
                    helpUrl = res.data.url;
                }else{
                    addEvent(nodeList.feedback, "click", evtFuncs.feedback);
                    addEvent(nodeList.tohelp, "click", evtFuncs.toHelp);
                //   className.add(nodeList.fixright, 'hide');
                    helpUrl = '';
               }
            }
        });
    },
}

//-------------一切从这开始--------------
!function() {
    user = runtime.getUser();
     // if (user == null) {
     //     dialogManager.alert("您还未登录", function() {
     //         location.href = "/login.html"
     //     });
     //
     //     return;
     // }

    // 必须提前绑好事件
    pathManager.bind("change", evtFuncs.hashchange);
    pathManager.start();
    if(theme === 'cloud-let' || theme === 'default') {
        custFuncs.queryHelp();//查询是否配置了帮助中心
        custFuncs.queryHeplUrl();
    }
    window.framesManager = that;
    that.has = custFuncs.hasFrame;
    that.close = custFuncs.closeFrame;
    that.reload = custFuncs.reloadFrame;
    that.closeTabByUrl = custFuncs.closeTabByUrl;
    that.createScript = custFuncs.createScript;
    that.closeMenu = evtFuncs.closeMenu;
}();