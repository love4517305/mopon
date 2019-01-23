/**
 * 存储了一些运行时数据或者方法
 */
var console = require("lib/io/console");
var when = require("lib/util/when");
var ajax = require("lib/io/ajax");
var URL = require("lib/util/URL");
var dialogManager = require("plugin/dialog/frameDialogManager");
var storage = require('vlib/util/storage').default;
var api = require("vs/api").default;
var that = {};
var moduleName = null;
var moduleId = null;
var path = null;
var authority = null;
var moduleJSON = null;

(function() {
    var url = URL.parse(URL.parse(location.href).hash);
    if(url.path === "/proxy.html"){
        url.path = storage.get("hash.url") || url.path;
    }
    path = url.path.substr(url.path.charAt(0) == "/" ? 1 : 0);
    var array = path.split("/");
    moduleName = array[0];
    path = "/" + array.slice(1).join("/");
    moduleId = url.queryJson["appid"];
    storage.put(api.const.APPID, moduleId);
})();

/**
 * 获取模块名，仅用于proxy页面调用
 */
that.getModuleName = function() {
    return moduleName;
}

/*
*获取环境
 */
that.getDev = function(){
    var cls = document.body.className;
    if(cls.indexOf('cloud-zy') > -1){
        return 'cfc';
    }else if(cls.indexOf('cloud-ng') > -1){
        return 'ng';
    }else if(cls.indexOf('cloud-let') > -1){
        return 'let';
    }else if(cls.indexOf('cloud-xflh') > -1){
        return 'xflh';
    }else if(cls.indexOf('cloud-freely') > -1){
        return 'freely';
    }else if(cls.indexOf('cloud-hq') > -1){
        return 'hq';
    }else if(cls.indexOf('cloud-my') > -1){
        return 'my';
    }
    return '';
};

/**
 * 获取路径名，不包含模块名，仅用于proxy页调用
 */
that.getPath = function() {
    return path;
}

/**
 * 获取appid，仅用于proxy页调用
 */
that.getModuleId = function() {
    return moduleId;
}

/*****
 * 获取authority权限
 */
that.getAuthority = function(){
    return authority;
}

/*******
 * 获取通用按钮名称
 */
that.getLanguage = function(){
    return {
        look: "查看",
        add: "新增",
        edit: "编辑",
        del: "删除"
    }
};

/**
 * 获取当前用户信息，如果不存在则返回null
 */
that.getUser = function() {
    if (localStorage.getItem("user")) {
        try {
            return JSON.parse(localStorage.getItem("user"));
        }catch(ex) {
            console.error("localStorage中存储的user信息有问题");
            return null;
        }
    } else {
        return null;
    }
}

/**
 * 设置当前用户，如果传入参数为空则是退出登录
 */
that.setUser = function(user) {
    if (user == null) {
        localStorage.removeItem("user");
    } else {
        storage.put(api.const.USER, user);
        localStorage.setItem("user", JSON.stringify(user));
    }
}

/**
 * 获取当前影院，如果不存在则返回null
 */
that.getCinemaInfo= function() {
    if (localStorage.getItem("default.cinema")) {
        try {
            return JSON.parse(localStorage.getItem("default.cinema"));
        }catch(ex) {
            console.error("localStorage中存储的cinema信息有问题");
            return null;
        }
    } else {
        return null;
    }
}

/**
 * 设置当前用户，如果传入参数为空则是退出登录
 */
that.setCinemaInfo = function(cinema) {
    if (cinema === null) {
        localStorage.removeItem("default.cinema");
    } else {
        localStorage.setItem("default.cinema", JSON.stringify(cinema));
    }
}

/**
 * 用于获取网络异常时的统一提示信息
 * @param  {XMLHttpRequest} req xmlhttp对象
 */
that.getHttpErrorMessage = function(req) {
    return "网络异常，请重新尝试(" + req.status + ")";
}

/**
 * 用于获取当前页的权限数据
 * 自动从location.href中取
 * 注：支持promise(when.js)
 */
that.authenticate = function() {
    var defer = when.defer();
    ajax({
        "url": "/proxy/cloud/platform/authenticate",
        "method": "get",
        "data": {
            appid: moduleId,
            uri: "/" + moduleName + path
        },
        "onSuccess": function(res) {
            if(res.code == 0){
                authority = res.data;
                defer.resolve();
            }else{
				dialogManager.alert("没有权限访问此页面！");
            }
        },
        "onError": function(req) {
            if (req.status == "401") {
				dialogManager.alert("请先登录！", function(){
					top.location.href = "/login.html";
				});
            }else if(req.status == "403"){
                dialogManager.alert("没有权限访问此页面！");
            }
            // TODO 将本页权限数据保存到一个变量中，然后that提供个api用来做验证
        }
    });
    return defer.promise;
}

that.childModule = function() {
    var defer = when.defer();
    if(moduleJSON !== null){
        defer.resolve(moduleJSON);
    }else{
        ajax({
            "url": "/common/config/module.json?ver=" + new Date().getTime(),
            "method": "get",
            "onSuccess": function(res) {
                moduleJSON = res;
                defer.resolve(res);
            },
            "onError": function(req) {
                defer.reject(req);
            }
        });
    }
    return defer.promise;
}

/********
 * 用于获取子模块配置数据
 */


/**
 * 页面加载失败时统一调用，后边应该改成刷新当页
 */
that.pageRenderError = function(msg) {
    // 可能会需要在这里处理刷新页面
    console.error(msg);
}

module.exports = that;