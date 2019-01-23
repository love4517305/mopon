/**
 * 加载外部文件
 * 注意：为了更流畅地写代码，请在入口文件直接加载完毕而不是谁引用谁调用，否则会出现问题
 */
// extra.loadECharts()
//     .then(extra.loadUEditor)
//     .then(function() {
//         console.log(echarts);
//         console.log(UE);
//     })
var when = require("lib/util/when");
var scriptLoader = require("lib/io/scriptLoader");
var cssLoader = require("lib/io/cssLoader");
var echarts = false;
var ueditor = false;
var basePath = "/common/js";

var plugins = {
    echarts: "/echarts.js",
    echarts2All: "/echarts-all.js",
    echarts3: "/echarts3.js",
    echartsNew: '/echarts.min.js',
    map: "/china.js",
    ueditor: "/ueditor/ueditor.min.js",
    Clipboard: "/ueditor/third-party/clipboard.js",
    CosCloud: "/cos-js-sdk-v4.js",
    crypto: "/crypto.js",
    md5: "/md5.js",
    jquery: "/jquery-1.8.3.js",
    jqueryVer11: "/jquery-1.11.0.js",
    qtipcss:"/jquery.qtip.min.css",
    qtipjs:"/jquery.qtip.pack.js",
    outerhtml: "/jquery.outerhtml.js",
    jqueryui: "/jquery-ui-1.9.2.min.js",
    froalaEditorJS: "/ueditor/third-party/froalaEditor/js/froala_editor.pkgd.min.js",
    froalaEditorLangJS: "/ueditor/third-party/froalaEditor/js/languages/zh_cn.js",
    froalaEditorPkgdCSS: "/ueditor/third-party/froalaEditor/css/froala_editor.pkgd.min.css",
    froalaEditorCSS: "/ueditor/third-party/froalaEditor/css/froala_style.min.css",
    froalaEditorFontCSS: "/ueditor/third-party/froalaEditor/css/font-awesome.min.css",
}

var load = function(plugin) {
    return scriptLoader(basePath + plugins[plugin]);
};
var loadCss = function (plugin) {
    return cssLoader(basePath + plugins[plugin]);
}
module.exports = {
    /**
     * 加载后可以用window.echarts来访问
     */
    //echarts 2
    loadECharts: function() {
        return load("echarts");
    },
    //echarts 3
    loadECharts3: function() {
        return load("echarts3");
    },
    //echarts 3
    loadEChartsNew: function() {
        return load("echartsNew");
    },
    //echarts 2完整版
    loadECharts2All: function() {
        return load("echarts2All");
    },
    //echarts地图 需先引入echarts3
    loadMap: function() {
        return load("map");
    },
    /**
     * 加载后可以使用window.UE来访问
     */
    loadUEditor: function() {
        return load("ueditor");
    },
    //复制插件
    loadClipboard: function() {
        return load("Clipboard");
    },
    loadCosCloud: function () {
        return load("CosCloud")
    },
    loadCrypto: function () {
        return load("crypto")
    },
    loadMD5: function () {
        return load("md5")
    },
    loadJquery: function () {
        return load("jquery")
    },
    loadQtipJs: function () {
        return load("qtipjs")
    },
    loadQtipCss: function () {
        return loadCss("qtipcss")
    },
    loadOuterHtml: function () {
        return load("outerhtml")
    },
    loadJqueryUi: function () {
        return load("jqueryui")
    },    
    loadJqueryVer11: function () {
        return load("jqueryVer11")
    },
    loadFroalaEditor: function () {
        var defer = when.defer();
        this.loadJqueryVer11()
            .then(FroalaEditor.loadFroalaEditorFontCSS)//小图标及字体样式
            .then(FroalaEditor.loadFroalaEditorPkgdCSS)
            .then(FroalaEditor.loadFroalaEditorCSS)
            .then(FroalaEditor.loadFroalaEditorJS)
            .then(FroalaEditor.loadFroalaEditorLangJS)            
            .then(function(){
                defer.resolve();
            })
        return defer.promise;
    },
}

var FroalaEditor = {
    loadFroalaEditorJS: function () {
        return load("froalaEditorJS");
    },
    loadFroalaEditorLangJS: function () {
        return load("froalaEditorLangJS");
    },
    loadFroalaEditorPkgdCSS: function () {
        return loadCss("froalaEditorPkgdCSS");
    },
    loadFroalaEditorCSS: function () {
        return loadCss("froalaEditorCSS");
    },
    loadFroalaEditorFontCSS: function () {
        return loadCss("froalaEditorFontCSS");
    },
}

