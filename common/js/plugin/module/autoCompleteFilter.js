/**
 * Created by 璩 on 2016/8/24.
 * 自动补全
 */
module.exports = function(node, opts) {
//----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var merge = require("lib/json/merge");
    var popup = require("lib/layer/popup");
    var setStyle = require("lib/dom/setStyle");
    var addEvent = require('lib/evt/add');
    var eventProxy = require("lib/evt/proxy");
    var when = require("lib/util/when");
    var filter = require("plugin/util/filterData");
    var getPosition = require("lib/dom/getPosition");
    var opra = require("lib/dom/node");
    var className = require("lib/dom/className");
    var ajax = require("lib/io/ajax");
    var isNode = require("lib/dom/isNode");
    var simScroll = require("./simScroll.js")

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var selectIndex = -1;
    var isScroll = false;
    var isRun = false;
    var m_box = null;
    var lastValue = null;
    var map = null;
    var m_simScroll = null;
    var items = []
    opts = merge({
        maxRows: 10,//最大行数
        top: 0,
        left: -1,
        blur: false,//非模糊查   预留
        data: {},
        width: null,
        itemHeight: 28//每行高度
    }, opts || {});

    //-------------事件响应声明---------------
    var evtFuncs = {
        autoComplete: function (e) {
            console.log(e);
            if(e.keyCode == 38 || e.keyCode == 40) return;
            if (custFuncs.getItemsHTML(opts.data) == '') {
                className.add(m_box.getOuter(), 'hide')
            }else{
                className.remove(m_box.getOuter(), 'hide')
            }
            nodeList.box.innerHTML = custFuncs.getItemsHTML(opts.data);
            var pos = getPosition(node);
            var x = pos.left + parseInt(opts.left);
            var y = pos.top + parseInt(opts.top) + node.offsetHeight;
            nodeList.box.style.width = opts.width != null ? parseInt(opts.width) + "px" : node.offsetWidth + "px";
            m_box.show(x, y);
            m_simScroll.loadScroll()
        },
        hideBox: function (e) {
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            if(elem == node) return;
            m_box.hide();
        },
        selectItem: function(evt){
            var text = evt.target.getAttribute("data-text");
            var key = evt.target.getAttribute("data-key");
            node.value = text;
            m_box.hide();
            that.fire("select", {type: "ok", key: key, val: text, node: node});
        },
        keyDown : function(e){
            items = nodeList.box.children;
            if(!m_box.getStatus() || !items.length) return;
            var k = e.keyCode;
            var len = items.length;
            if(k==38){  //↑
                selectIndex = --selectIndex <= -1 ? len - 1 : selectIndex;
                custFuncs.setStyle(k);
            }else if (k == 40) {//↓
                selectIndex = ++selectIndex >= len ? 0 : selectIndex;
                custFuncs.setStyle(k);
            }else if(k==13){ //enter
                if(selectIndex == -1) return;
                var self = items[selectIndex];
                var text = self.getAttribute("data-text");
                var key = self.getAttribute("data-key");
                node.value = text;
                node.blur();
                m_box.hide();
                that.fire("select", {type: "ok", key: key, val: text, node: node});
            }
        },
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_simScroll = simScroll(nodeList.box,{autoChange:true})
        m_simScroll.init()
    };

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(node, "input", function (e) {
            setTimeout(function(){
                evtFuncs.autoComplete(e)
            }, 100)
        })
        addEvent(document.body, "click", evtFuncs.hideBox);
        eventProxy(nodeList.box).add("item", "click", evtFuncs.selectItem);
        addEvent(node, "input", evtFuncs.keyDown);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        createHTML: function () {
            m_box = popup("<div class='m-autoComplete' style='overflow:hidden'><ul node-name='box' style='overflow-y:auto'></ul></div>");
            nodeList = parseModule(m_box.getOuter());
            var h = parseInt(opts.itemHeight);
            nodeList.box.style.maxHeight = h * opts.maxRows + "px";
        },
        getItemsHTML: function(list){
            if (node.value == '') return '';
            var code = '';
            var val = node.value;
            var len = val.length;
            var h = parseInt(opts.itemHeight);
            each(list, function(value, key){
                var reg = new RegExp(val, "g")
                if (reg.test(value)) {
                    code += '<li data-action="item" data-key="'+ key +'" style="height: '+ h +'px;line-height: '+ h +'px" data-text="'+ value +'">' + value + '</li>';
                }
            });
            return code;
        },
        setStyle: function () {
            var outer = m_box.getOuter();
            each(items, function (v) {
                className.remove(v, "selected");
            })
            if(selectIndex != -1){
                className.add(items[selectIndex], "selected");
            }
        }
    };

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        custFuncs.createHTML();
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    };

    //---------------暴露API----------------
    that.init = init;

    return that;
}