/**
 * @author 璩
 * @data 2016-08-19
 * @description 分页
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var merge = require("lib/json/merge");
    var render = require("plugin/tmpl/page.ejs");
    var addEvent = require('lib/evt/add');
    var className = require("lib/dom/className");
    var opra = require("lib/dom/node");
    var eventProxy = require("lib/evt/proxy");
    var each = require("lib/util/each");
   // var scss = require("plugin/scss/page.scss");

    //-----------声明模块全局变量-------------
    var nodeList = node; // 存储所有关键节点
    var that = base();
    var data = null;

    opts = merge({
        totalPages: 1,//总页数
        pageSize: 20,//每页显示几条
        curPage: 1,//当前页
        totalRows: 0,//总条数
        pageList: [10, 20, 30, 40, 50]//每页数列表
    }, opts || {});

    //-------------事件响应声明---------------
    var evtFuncs = {
        pageTurn: function(e){
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            if(elem.nodeName.toLowerCase() == "i") elem = elem.parentNode;
            if(className.has(elem, "gray")) return;
            var v = nodeList.page.value;
            var dataValue = elem.getAttribute("data-value");
            if(dataValue) v = dataValue;
            opts.curPage = parseInt(v);
            that.fire("page", {
                pageSize: opts.pageSize,
                curPage: v
            });
            custFuncs.setPage();
        },
        selectPageSize: function(e){
            var elem = e.target;
            var val = elem.innerHTML;
            var node = opra.prev(elem.parentNode);
            node.value = val;
            className.add(elem.parentNode, "hide");
            opts.pageSize = parseFloat(val);
            custFuncs.updatePage(opts.totalRows);
            that.fire("page", {
                pageSize: opts.pageSize,
                curPage: opts.curPage
            });
            custFuncs.setPage();
        },
        formatNumber: function(){
            var v = nodeList.page.value;
            var d = opts.curPage;
            var newStr = function(r){
                var str = "";
                each(r, function(item){
                    if(item != "."){
                        str += item;
                    }
                });
                return str;
            };

            if(!/^\d+$/.test(v)){
                var r = v.match(/\d|\./g);
                nodeList.page.value = r == null ? (d == "" ? 0 : d) : newStr(r);
            }
            if(v == '0') {
                 nodeList.page.value = opts.curPage;
            }
            nodeList.page.value = Math.min(opts.totalPages, nodeList.page.value);
        },
        showSelect: function(){
            className.remove(nodeList.select, "hide");
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(nodeList.btn, "click", evtFuncs.pageTurn);
        addEvent(nodeList.first, "click", evtFuncs.pageTurn);
        addEvent(nodeList.prev, "click", evtFuncs.pageTurn);
        addEvent(nodeList.next, "click", evtFuncs.pageTurn);
        addEvent(nodeList.last, "click", evtFuncs.pageTurn);
        addEvent(nodeList.page, "input", evtFuncs.formatNumber);
        addEvent(nodeList.pageSize, "click", evtFuncs.showSelect);
        eventProxy(node).add("select", "click", evtFuncs.selectPageSize);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        setPage: function(){
            opts.totalPages = Math.ceil(opts.totalRows / opts.pageSize);
            opts.curPage = Math.min(Math.max(1, opts.totalPages), opts.curPage);
            nodeList.pageSize.value = opts.pageSize;
            nodeList.page.value = opts.curPage;
            nodeList.text.innerHTML = "当前"+ Math.min(opts.totalRows, (opts.curPage - 1) * opts.pageSize + 1) +"到"+ Math.min(opts.totalRows, opts.curPage * opts.pageSize) +"条，总共"+ opts.totalRows +"条";
            nodeList.total.innerHTML = Math.min(opts.totalPages, opts.curPage) + " / " + opts.totalPages;
            nodeList.first.setAttribute("data-value", 1);
            nodeList.prev.setAttribute("data-value", Math.max(1, opts.curPage - 1));
            nodeList.next.setAttribute("data-value", Math.min(Math.max(1, opts.totalPages), opts.curPage + 1));
            nodeList.last.setAttribute("data-value", Math.max(1, opts.totalPages));
            if(opts.curPage == 1){
                className.add([nodeList.first, nodeList.prev], "gray");
            }else{
                className.remove([nodeList.first, nodeList.prev], "gray");
            }
            if(opts.curPage >= opts.totalPages){
                className.add([nodeList.last, nodeList.next], "gray");
            }else{
                className.remove([nodeList.last, nodeList.next], "gray");
            }
            if(opts.totalPages <= 1){
                className.add(nodeList.btn, "gray");
            }else{
                className.remove(nodeList.btn, "gray");
            }
        },
        updatePage: function(totalRows){
            opts.totalRows = parseInt(totalRows);
            custFuncs.setPage();
        },
        setCurPage: function (curPage) {
            opts.curPage = parseInt(curPage);
            that.fire("page", {
                pageSize: opts.pageSize,
                curPage: curPage
            });
            custFuncs.setPage();
        },
        initView: function(){
            custFuncs.setPage(opts.totalRows);
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;

        node.innerHTML = render(opts);
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
    that.updatePage = custFuncs.updatePage;
    that.setCurPage = custFuncs.setCurPage;

    return that;
};