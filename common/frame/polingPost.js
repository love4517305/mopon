/**
 * @author benny.zheng
 * @data 2016-07-20
 * @description 管理各iframe
 */

module.exports = function (node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var each = require("lib/util/each");
    var ajax = require("lib/io/ajax");
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var when = require("lib/util/when");
    var merge = require("lib/json/merge");
    var localForage = require("plugin/util/localforage");
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var Timer = null;

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function () {

    }

    //-------------绑定事件------------------
    var bindEvents = function () {
    }

    //-------------自定义函数----------------
    var custFuncs = {
        getTreeData: function (url,cache,data) {
            var defer = when.defer();
            ajax({
                url: "/proxy/" + url,
                data: merge(data,{returnHalls:true}),
                method: "post",
                onSuccess: function (res) {
                    var obj = {};
                    if (res.code == 0) {
                        defer.resolve(res);
                        obj["cinema"] = res.data;
                        var r = merge(window[cache],obj);
                        try{
                            localForage.setItem('window.'+cache, r);
                        }catch(e){}
                        window[cache] = r;
                    } else {
                        defer.reject(res.msg);
                        console.log(res.msg);
                        //dialogManager.alert(res.msg);
                    }
                },
                onError: function (req) {
                    defer.reject(req);
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        getTreeCity: function (url,cache) {
            var defer = when.defer();
            ajax({
                url: "/proxy/" + url,
                data: {},
                method: "post",
                onSuccess: function (res) {
                    var obj = {};
                    if (res.code == 0) {
                        defer.resolve(res);
                        obj["city"] = res.data;
                        var r = merge(window[cache],obj);
                        try{
                            localForage.setItem('window.'+cache, r);
                        }catch(e){}
                        window[cache] = r;
                    } else {
                        defer.reject(res.msg);
                        console.log(res.msg);
                        //dialogManager.alert(res.msg);
                    }
                },
                onError: function (req) {
                    defer.reject(req);
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        initView: function () {
            var tid = setTimeout(function() {
                clearTimeout(tid);
                custFuncs.initPageData();
            }, 2000);

            Timer = setInterval(function () {
                custFuncs.initPageData();
            }, 15*60*1000);
        },
        initPageData: function () {
            var defer = when.defer();
            when.all([
                custFuncs.getTreeCity("base/site/baseinfo/v1/queryCityCinemasAndhallsTotal","cache"),
                custFuncs.getTreeData("base/site/baseinfo/v1/queryCinemasAndhallsList","cache"),
                custFuncs.getTreeCity("base/site/baseinfo/v1/queryCinemasWithDataLevelTotal","cache2"),
                custFuncs.getTreeData("base/site/baseinfo/v1/queryCinemasWithDataLevelList","cache2"),
                custFuncs.getTreeCity("base/site/baseinfo/v1/queryCinemasWithDataLevelTotal","cache3",{salable:1}),
                custFuncs.getTreeData("base/site/baseinfo/v1/queryCinemasWithDataLevelList","cache3",{salable:1}),
                custFuncs.getTreeCity("good/site/snack/v1/getAllSnackCinameCities","cache4"),
                custFuncs.getTreeData("good/site/snack/v1/queryCinemaSnacksTree","cache4"),
                custFuncs.getTreeCity("base/site/baseinfo/v1/queryCinemasWithDataLevelTotal","cache5",{channelPolicy:0}),
                custFuncs.getTreeData("base/site/baseinfo/v1/queryCinemasWithDataLevelList","cache5",{channelPolicy:0}),
            ])
                .then(function (res) {
                    defer.resolve(res);
                    window.sessionStorage.setItem('cinema.stop', '1');
                }).otherwise(function (msg) {
                console.log(msg);
                defer.reject("页面初始化所需数据无法全部获取, 请刷新界面");
            });
            return defer.promise;
        }
    }

    //-------------一切从这开始--------------
    var init = function (_data) {
        data = _data;
        // 找到所有带有node-name的节点
        nodeList = parseModule(node);
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