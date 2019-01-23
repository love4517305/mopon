/**
 * @author shixing
 * @date 2016-09-16
 * @description 消息详情
 */
module.exports = function(opts) {
    //----------------require--------------
    var base = require("lib/comp/base");
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var render = require("./msgDetail.ejs");
    var dialog = require("plugin/dialog/dialog");
    var runtime = require("plugin/runtime");
     var grid = require("plugin/module/grid");
    var scss = require("./main.scss");
    var className = require("lib/dom/className");
    var merge = require("lib/json/merge");

    opts = opts || {};
    var msgCode = opts.data.msgCode;
    var newContent = null;
    var index = null;
    var contactStr = null;
    var infoArr = null;
    var useful = null;
    if (typeof msgCode != "undefined" && msgCode == "ghq_1001") {
        newContent = JSON.parse(opts.data.content);
        var totalGoods = parseInt(newContent.totalGoods);
        opts.data.content = newContent;
        var res = newContent.contentDetail;
        var msgMainContent = opts.data.content.msgMainContent;
        index = msgMainContent.indexOf('已');
        contactStr = msgMainContent.slice(index);

        infoArr = msgMainContent.split('、');
        if (infoArr.length>=6) {
            useful = (infoArr.slice(0,5)).toString();
            opts.data.content.msgMainContent = useful + '等...' + contactStr ;
        }
    }    
    var config = {
        title: "查看消息",
        boxHTML: render({data: opts.data}),
        buttons: [
            { "id": "cancel", "text": "关闭" }
        ]
    };
    //-----------声明模块全局变量-------------
    var nodeList = null;                // 存储所有关键节点
    var that = dialog(config);
    var node = that.getOuter();
    var m_grid = null;
    var option = null;
    var params = null;
    var arr = [];
    var i = 0;

    //-------------事件响应声明---------------
    var evtFuncs = {
        buttonClick: function(evt) {
            if(evt.data.type == "cancel"){
                that.hide("cancel");
                top.framesManager.reload("/mmc/msgMenu");
            }
        },
        show: function(evt) {
            m_grid = grid(nodeList.grid, option);
            m_grid.init();
            m_grid.bind("page", evtFuncs.page);

            if (msgCode != "ghq_1001"|| (typeof msgCode == "undefined") ) {
                nodeList.cont.style.height = 300 + "px";
                className.add(nodeList.isGhq, "hide");
                var client = document.documentElement.clientHeight;
                var dialogStyle = nodeList.box.parentNode.style;
                var  num = getComputedStyle(nodeList.box.parentNode,false).height;
                dialogStyle.top = (parseInt(client) - parseInt(num))/2 + 'px';
            }
            else {
                m_grid.addRows(custFuncs.filterPage(params.pageNumber, params.pageSize));
                m_grid.updatePage(totalGoods, params.pageNumber);
            }
        },
        page: function(e) {
            params.pageNumber = e.data.curPage;
            params.pageSize = e.data.pageSize;
            m_grid.addRows(custFuncs.filterPage(params.pageNumber, params.pageSize));
            m_grid.updatePage(totalGoods, params.pageNumber);
        }
    };

    //-------------子模块实例化---------------
    var initMod = function(){};

    //-------------绑定事件------------------
    var bindEvents = function() {
        that.bind('show', evtFuncs.show);
        that.bind("buttonclick", evtFuncs.buttonClick);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        filterPage: function(cur, pageNum){
            if(!!res){
                return res.slice((cur - 1) * pageNum, cur * pageNum);
            }
        },
        createGrid: function() {
            option = {
                columns: [
                    {
                        display: "商品编码",
                        name: "goodsCode",
                        align: "center",
                        itemAlign: "center"
                    },
                    {
                        display: "商品名称",
                        name: "goodsName",
                        align: "center",
                        itemAlign: "center",
                        width: 200
                    },
                    {
                        display: "类型",
                        name: "goodsKind",
                        align: "center",
                        itemAlign: "center",
                        width: 150
                    },
                    {
                        display: "当前库存",
                        name: "curStockCount",
                        align: "center",
                        itemAlign: "center",
                        width: 150
                    },
                    {
                        display: "安全库存",
                        name: "warnStockCount",
                        align: "center",
                        itemAlign: "center",
                        width: 150
                    }
                ],
                selectType: false,
                pageSize: 5,
                pageList: [5] //每页数列表
            }
        },
    };

    //-------------一切从这开始--------------
    
    nodeList = parseModule(node);
    params = {pageNumber: 1, pageSize: 5};
    custFuncs.createGrid();
    
    initMod();
    
    bindEvents();

    //---------------暴露API----------------

    return that;
};