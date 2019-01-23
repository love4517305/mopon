/**
 * @author 璩
 * @data 2016-08-21
 * @description 整合下拉框
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var select = require("plugin/module/dropmenu");
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    //-----------声明模块全局变量-------------
    var nodeList = node; // 存储所有关键节点
    var that = base();
    var data = null;
    var m_select = null;
    var selectMap = {};

    opts = opts || { map: {}, defaultIndex: null, disabled: false };

    //-------------事件响应声明---------------
    var evtFuncs = {
        dropMenuChosed: function(evt) {
            that.fire("selectChange", evt.data);
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        nodeList = node ? [].concat(node) : [];
        each(nodeList, function(item) {
            var key = item.getAttribute("data-key");
            m_select = select(item, {
                disabled: opts.disabled
            });
            m_select.bind("dropMenuChosed", evtFuncs.dropMenuChosed);
            m_select.init();
            selectMap[key] = m_select;
            try {
                m_select.loadData({
                    selectMenuData: {
                        "selectItems": opts.map[key] || {}
                    }
                });
            } catch (e) {
                console.log("数据出错:" + e.message)
            }
            if (opts.defaultIndex != null) {
                m_select.setDefaultValue(true, null, opts.defaultIndex);
            }
        });
    }

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {
            changeData: function(data) {
                m_select.changeData(data)
            },
            setOptions: function(data, key, defaultValue, defaultIndex) {
                defaultValue = getType(defaultValue) == "undefined" ? null : defaultValue;
                defaultIndex = getType(defaultIndex) == "undefined" ? null : defaultIndex;
                var sel = selectMap[key];
                if (sel) {
                    sel.changeData({ selectMenuData: { selectItems: data } });
                    if (defaultValue != null || defaultIndex != null) {
                        sel.setDefaultValue(true, defaultValue, defaultIndex);
                    }
                }
            }
        }
        //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
        // //console.log(m_select)
    }

    //---------------暴露API----------------
    that.init = init;
    that.changeData = custFuncs.changeData;
    that.setOptions = custFuncs.setOptions;
    return that;
};