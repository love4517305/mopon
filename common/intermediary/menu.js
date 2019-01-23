/**
 * Created by hou on 2017/3/7.
 * 单点登录鉴权
 */
module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var ajax = require("lib/io/ajax");
    var each = require("lib/util/each");
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var merge = require("lib/json/merge");
    var className = require('lib/dom/className');
    var dialogManager = require("plugin/dialog/layer");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {};

    //-------------绑定事件------------------
    var bindEvents = function() {};

    //-------------自定义函数----------------
    var custFuncs = {
        initView: function() {
            var obj = custFuncs.parseQueryString(location.search);
            ajax({
                url:"/proxy/cloud/platform/doLandAuth" ,
                data: {params: JSON.stringify(obj)},
                method: "post",
                onSuccess: function(res){
                    if(res.code == 0){
                        runtime.setUser({"name": res.data.name, "roleName": res.data.roleName, "userType": res.data.userType});
                        location.href = "frame.html" + res.data.resultURI;
                    }else {
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
        },
        parseQueryString: function (url){
            var obj = {};
            var start = url.indexOf("?") + 1;
            var str = url.substr(start);
            var arr = str.split("&");
            for(var i = 0 ;i < arr.length; i++){
                var arr2 = arr[i].split("=");
                obj[arr2[0]] = arr2[1];
            }
            return obj;
    }
    };

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 找到所有带有node-name的节点
        nodeList = parseModule(node);
        custFuncs.initView();
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;

    return that;
};
