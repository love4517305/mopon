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
var scss = require("./main.scss"); // 引入当前页面的scss文件
// 模板
var render = require("./main.ejs"); // 页面总模板
// 子模块
// var header = require("./header");

//-----------声明模块全局变量-------------
var nodeList = null; // 存储所有id符合m-xxx的节点
var opts = pageConfig; // 请不要直接使用pageConfig
// var m_header = null;

//-------------事件响应声明---------------
var evtFuncs = {}

//-------------子模块实例化---------------
var initMod = function() {
    // m_header = header(nodeList.header, opts);
    // m_header.init();

    // 所有模块的模板render应该是由外部传进去，而不是内部直接require，主要是考虑到复用性
    // 这里的模板并不是模块的模板，而是内部需要动态生成东西时用的模板，模块的模板在main.ejs已经写进去了
    // 以下是示例
    // m_header = header(nodeList.header, {
    //     render: headerRender
    // });

    // m_header = header(nodeList.header, {
    //     renders: {
    //         "main": headerRender
    //     }
    // });
}

//-------------绑定事件------------------
var bindEvents = function() {}

//-------------自定义函数----------------
var custFuncs = {}

//-------------一切从这开始--------------
!function() {
    // 先将HTML插入body
    document.body.insertAdjacentHTML('AfterBegin', render(opts.modules));

    // 找到所有带有id的节点，并将m-xxx-xxx转化成xxxXxx格式存储到nodeList中
    nodeList = parsePage();
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();
}();





