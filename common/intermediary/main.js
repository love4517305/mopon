/**
 * Created by hou on 2017/3/7.
 * 单点登录鉴权
 */
//----------------require--------------

var base = require("lib/comp/base"); // 基础对象
var parsePage = require("lib/dom/parsePage"); // 页面模块自动解析
var scss = require("./main.scss"); // 引入当前页面的scss文件
// 模板
var render = require("./main.ejs"); // 页面总模板
// 子模块
var menu = require("./menu");

//-----------声明模块全局变量-------------
var nodeList = null; // 存储所有id符合m-xxx的节点
var m_menu = null;

//-------------事件响应声明---------------
var evtFuncs = {}

//-------------子模块实例化---------------
var initMod = function() {
    m_menu = menu(nodeList.menu);
    m_menu.init();
}

//-------------绑定事件------------------
var bindEvents = function() {}

//-------------自定义函数----------------
var custFuncs = {}

//-------------一切从这开始--------------
!function() {
    // 先将HTML插入body
    document.body.insertAdjacentHTML('AfterBegin', render());

    // 找到所有带有id的节点，并将m-xxx-xxx转化成xxxXxx格式存储到nodeList中
    nodeList = parsePage();
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();
}();





