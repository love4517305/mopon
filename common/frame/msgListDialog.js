/**
 * @author shixing
 * @date 2016-09-16
 * @description 消息列表
 */
module.exports = function(opts) {
    //----------------require--------------
    var base = require("lib/comp/base");
    var render = require('./msgListDialog.ejs');
    var parseModule = require('lib/dom/parseModule');
    var dialog = require('plugin/dialog/dialog');
    var dialogManager = require("plugin/dialog/manager");
    var msgDetailDialog = require("./msgDetailDialog");
    var grid = require('plugin/module/grid');
    var msgManager = require("./msgManager");

    //-----------声明模块全局变量-------------
    var dialogConfig = {
        title: '消息列表',
        boxHTML: render({}),
        buttons: [
            { 'id': 'cancel', 'text': '关闭' }
        ]
    };
    var that = dialog(dialogConfig);
    var node = that.getOuter();
    var data = null;
    var nodeList = null;
    var option = null;
    var m_grid = null;
    var params = { pageNumber: 1, pageSize: 50 };
    opts = opts || {};

    //-------------事件响应声明---------------
    var evtFuncs = {
        show: function(evt) {
            m_grid.init();
            custFuncs.updateGrid();
        },
        btnClick: function(evt) {
            that.hide('cancel');
        },
        viewMsg: function(ev) {
            msgManager.getMsgDetailById({ "id": ev.data.data.id })
                .then(function(res) {
                    console.log(res);
                    var dialog = msgDetailDialog({
                        data: res.data || {}
                    });
                    dialog.show();
                    custFuncs.updateGrid();
                });
        },
        page: function(e) {
            params.pageNumber = e.data.curPage;
            params.pageSize = e.data.pageSize;
            custFuncs.updateGrid();
        }
    };

    //-------------绑定事件------------------
    var bindEvents = function() {
        that.bind('show', evtFuncs.show);
        that.bind('buttonclick', evtFuncs.btnClick);
        m_grid.bind("viewMsg", evtFuncs.viewMsg);
        m_grid.bind("page", evtFuncs.page);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        createGrid: function() {
            option = {
                columns: [
                    // { display: "标题", name: "title", click: { id: "viewMsg" }},
                    {
                        display: "标题",
                        name: "title",
                        click: { id: "viewMsg" },
                        color: "#f00",
                        renderHTML: function(v, obj, util) {
                            var code = "";
                            code += util.buts({ id: "viewMsg", text: '[' + obj.typeName + ']  ' + obj.title });
                            return code;
                        }
                    },
                    { display: "状态", name: "readStatus" },
                    { display: "发件人", name: "fromUser" },
                    { display: "消息时间", name: "warnTime" }
                ],
                show: true,
                selectType: false,
                clickRows: true
            };
        },
        updateGrid: function(conditions) {
            if (conditions) {
                params.queryParams = conditions;
                params.pageNumber = 1;
                params.pageSize = 50;
            }
            msgManager.getMsgList({
                    pagination: JSON.stringify(params)
                })
                .then(function(res) {
                    if (res.code == 0) {
                        m_grid.addRows(res.data.records);
                        m_grid.updatePage(res.data.totalCount, params.pageNumber);
                    } else {
                        dialogManager.alert(res.msg);
                    }
                });
        }
    };

    //-------------子模块实例化---------------
    var initMod = function() {
        m_grid = grid(nodeList.grid, option);
    };

    //-------------一切从这开始--------------
    custFuncs.createGrid();

    nodeList = parseModule(node);

    initMod();

    bindEvents();

    return that;
};