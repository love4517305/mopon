/**
 * @author benny.zheng
 * @data 2016-07-20
 * @description 管理各iframe
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var render = require("./frames.ejs");
    var nodeOpera = require("lib/dom/node");
    var appendQuery = require("lib/str/appendQuery");
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var loading = require("plugin/dialog/loading");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var frames = {};
    var current = null;
    var timer = null;
    var child_modules = {};
    var load_modules = {};
    var exist_modules = {};

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {
        initChildSuc: function(){
            child_modules._resolve = true;
            var data = load_modules;
            load_modules = {};
            each(data, function(arr, key){
                each(arr, function(item){
                    custFuncs.loadModule(key, item.child, item.url, item.moduleId);
                });
            });
        },
        initChildModule: function(){
            runtime.childModule()
                .then(function(res){
                    var data = opts.theme === "cloud-ng" ? res.ng : res.default;
                    each(data, function(item, key){
                        child_modules[key] = {_version: data._version || new Date().getTime()};
                        each(item, function(v){
                            child_modules[key][v] = false;
                        });
                    });
                    custFuncs.initChildSuc();
                }).otherwise(function(){
                custFuncs.initChildSuc();
            });
        },
        childModuleFinish: function(module, child){
            child_modules[module][child] = true;
            if(child !== "comm"){
                loading.hide(node);
                var item = load_modules[module][child];
                custFuncs.addFrameURL(item.url, item.moduleId);
            }
        },
        timerDetection: function(){
            clearInterval(timer);
            timer = setInterval(function(){
                each(exist_modules, function(val, key){
                    if(window[val]){
                        loading.hide(node);
                        child_modules[key] = {_modules: true};
                        each(load_modules[key], function(item){
                            custFuncs.addFrameURL(item.url, item.moduleId);
                        });
                        delete exist_modules[key];
                    }
                });
            }, 50);
        },
        addFrameURL: function(url, moduleId){
            var html = null;

            if (current != null && current.getAttribute("data-url") == url) {
                return;
            } else if (current != null) {
                current.style.display = "none";
            }

            if (url in frames) {
                current = frames[url];
            } else {
                html = render({
                    url: appendQuery(url, {
                        appid: moduleId,
                        ver: new Date().getTime()
                    }),
                    path: url
                });
                node.insertAdjacentHTML('BeforeEnd', html);
                current = nodeOpera.last(node);
                frames[url] = current;
            }

            current.style.display = "block";
        },
        createScript: function(url, version, bool){
            var script = document.createElement("script");
            script.type = "text/javascript";
            if(!bool) script.async = true;
            script.src = url+ ".js?ver=" + version + '_' + new Date().getDate();//缓存一天
            document.getElementsByTagName("head")[0].appendChild(script);
        },
        loadModule: function(mod, child, url, moduleId){
            var cm = child_modules[mod];
            if(cm && (cm[child] || getType(cm[child]) === "undefined" || cm["_modules"])){
                custFuncs.addFrameURL(url, moduleId);
            }else{
                if(!load_modules[mod]) {
                    load_modules[mod] = {};
                }
                if(!load_modules[mod][child]){
                    loading.show(node, "background: #fff;");
                    if(child_modules[mod]){
                        var version = child_modules[mod]["_version"];
                        if(child_modules[mod]["comm"] === false){
                            custFuncs.createScript("./"+ mod +"/dist/common/module/comm", version, true);
                        }
                        custFuncs.createScript("./"+ mod +"/dist/common/module/" + child, version);
                    }else{
                        exist_modules[mod] = mod + "_modules";
                        custFuncs.createScript("./"+ mod +"/dist/common", new Date().getTime());
                        custFuncs.timerDetection();
                    }
                }
                load_modules[mod][child] = {url: url, moduleId: moduleId};
            }
        },
        addFrame: function(url, moduleId) {
            if(/#\/(\w+)\/(.*\w)/.test(url)){
                var mod = RegExp.$1;
                var child = RegExp.$2.split('/')[0];
                if(child_modules._resolve){
                    custFuncs.loadModule(mod, child, url, moduleId);
                }else{
                    if(!load_modules[mod]) {
                        load_modules[mod] = [];
                    }
                    load_modules[mod].push({url: url, moduleId: moduleId, child: child});
                }
            }else{
                custFuncs.addFrameURL(url, moduleId);
            }
        },
        removeFrame: function(url) {
            if (url in frames) {
                frames[url].parentNode.removeChild(frames[url]);
                delete frames[url];
            }
        },
        hasFrame: function(url) {
            return url in frames;
        },
        reloadFrame: function(url) {
            if (!(url in frames)) {
                return;
            }

            frames[url].contentWindow.location.reload(true);
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

        custFuncs.initChildModule();
        //custFuncs.timerDetection();
        window.childModuleFinish = custFuncs.childModuleFinish;
    }

    //---------------暴露API----------------
    that.init = init;
    that.addFrame = custFuncs.addFrame;
    that.hasFrame = custFuncs.hasFrame;
    that.removeFrame = custFuncs.removeFrame;
    that.reloadFrame = custFuncs.reloadFrame;

    return that;
};