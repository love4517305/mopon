/**
 * @author chenshuqi
 * @data 2016-12-26
 * @description 数据权限影城列表
 */
//----------------require--------------
var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
var dialog = require("plugin/dialog/dialog");
var render = require("plugin/tmpl/cinemaLineList.ejs");
var merge = require('lib/json/merge');
var formVerify = require("plugin/util/formVerify");
var addEvent = require('lib/evt/add');
var grid = require("plugin/module/grid");
var alert = require("plugin/dialog/alert");
var dialogManager = require("plugin/dialog/frameDialogManager");

module.exports = function(opts) {
    //-----------声明模块全局变量-------------
    opts = merge({
        "title": '选择影院',
        "boxHTML": render({ data: opts.data || {} }),
        "isLogin": false,
        "buttons": [
            { "id": "ok", "text": "确定", "type": "blue" },
            { "id": "cancel", "text": "关闭" }
        ]
    }, opts || {})

    var nodeList = null; // 存储所有关键节点
    var that = dialog(opts);
    var node = that.getOuter();
    var m_formVerify = null;
    var m_grid = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        buttonclick: function(ev) {
            switch (ev.data.type) {
                case "ok":
                    {
                        m_formVerify.run();
                    }

                    break;
                case "cancel":
                    {
                        that.hide("cancel");
                    }

                    break;
            }
        },

        formVerify: function(ev) {
            var rv = ev.data;

            if (!rv.yes) {
                if (opts.isLogin) {
                    var alertDialog = alert(rv.statusText, {
                        ok: function() {
                            console.log(1)
                            rv.self.focus();
                        }
                    });
                    alertDialog.show();
                }
                else {
                    dialogManager.alert(rv.statusText, function() {
                        rv.self.focus();
                    });
                }
                return;
            }

            rv.result.cinemas = [].concat(rv.result.cinemas);
            rv.result.isDefault = rv.result.isDefault == 'isDefault';
            that.fire("chooseCinemaLine", {result: rv.result});
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_formVerify = formVerify(nodeList.dialogForm);
        m_formVerify.init();
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        m_formVerify.bind("verify", evtFuncs.formVerify);
        that.bind("buttonclick", evtFuncs.buttonclick);
    }

    //-------------自定义函数----------------
    var custFuncs = {}

    //---------------暴露API----------------

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    return that;
};
