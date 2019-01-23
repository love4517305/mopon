/**
 * @璩
 */

module.exports = function(opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var builder = require("lib/layer/builder");
    var merge = require("lib/json/merge");
    var sizzle = require("lib/dom/sizzle");
    var addEvent = require("lib/evt/add");
    var defaultTMPL = require("plugin/tmpl/fixedTMPL.ejs");
    var moveLayer = require("plugin/module/moveLayer");
    var fixedGrid = require("plugin/tmpl/fixedGrid.ejs");
    var getType = require("lib/util/getType");
    var each = require("lib/util/each");
    var sNull = require("../util/sNull");
    var simScroll = require("plugin/module/simScroll");
    var clone = require("lib/json/clone");

    //-----------声明模块全局变量-------------
    // 下边是默认值
    opts = merge({
        keepMiddle: true,
        maskOpacity: 0
    }, opts || {});

    var template = defaultTMPL({});
    var config = {};
    var columns = [];
    var set = {};
    var m_simScroll = null;

    var nodeList = null; // 存储所有关键节点
    var that = builder.createFromHTML(template, opts);
    var node = that.getOuter();

    //-------------事件响应声明---------------
    var evtFuncs = {
        close: function(ev) {
            that.hide("close");
            columns = [];
            set = {};
        },
        show: function(){
            that.getMask().hide();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        var m_moveLayer1 = moveLayer(nodeList.title, {
            layer: node
        });
        m_moveLayer1.init();

        var m_moveLayer2 = moveLayer(nodeList.left, {
            layer: node,
            direct: "left",
            inner: 80
        });
        m_moveLayer2.init();

        var m_moveLayer3 = moveLayer(nodeList.right, {
            layer: node,
            direct: "right",
            inner: 80
        });
        m_moveLayer3.init();

        m_moveLayer1.bind("down", custFuncs.down);
        m_moveLayer2.bind("down", custFuncs.down);
        m_moveLayer3.bind("down", custFuncs.down);
        m_moveLayer1.bind("up", custFuncs.up);
        m_moveLayer2.bind("up", custFuncs.up);
        m_moveLayer3.bind("up", custFuncs.up);

        m_simScroll = simScroll(nodeList.content, {
            autoChange: true,
            border: {
                top: 0,
                bottom: 0
            },
            vertical: {
                bottom: 5
            },
            horizontal: {
                top: 20,
                right: 5
            }
        });
        m_simScroll.init();
        m_simScroll.loadScroll();
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        if (nodeList.close) {
            addEvent(nodeList.close, "click", evtFuncs.close);
        }

        that.bind("show", evtFuncs.show);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        down: function(){
            that.getMask().show();
        },
        up: function(){
            that.getMask().hide();
        },
        setOption: function(opt){
            config = merge(config, opt);
        },
        showList: function(x, y){
            config.columns = columns;
            var len = columns.length;
            if(!that.getStatus() && len > 0){
                that.show();
                var left = document.querySelector("#m-layout-nav").offsetWidth;
                var header = document.querySelector("#m-header");
                var top = header ? header.offsetHeight : -12;
                that.setPosition(x + left + 8 + "px", y + top + 41 - config.titleHeight + "px");
            }else if(len === 0 || getType(config.resourse) !== "array"){
                that.hide();
                return;
            }
            var width = 0;
            each(columns, function(item){
                if(!item.dWidth) item.dWidth = item.width;
                width += parseInt(item.dWidth);
            });
            each(columns, function (item) {
               item.width = item.width / width * 100 + "%";
            });
            node.style.width = Math.min(800, width + 35) + "px";
            if(width > 800){
                nodeList.box.style.minWidth = width + "px";
            }else{
                nodeList.box.style.minWidth && nodeList.box.style.removeProperty("minWidth");
            }
            nodeList.box.innerHTML = custFuncs.renderHTML(fixedGrid(config));
        },
        addColumns: function(col, x, y, height){
            if(set[col.name]) return;
            set[col.name] = true;
            columns.push(clone(col));
            custFuncs.showList(x, y);
            nodeList.content.style.height = height + config.rowHeight + "px";
        },
        delColumns: function(col){
            each(columns, function(item, index){
                if(item.name === col.name){
                    delete set[col.name];
                    columns.splice(index, 1);
                    return false;
                }
            });
            custFuncs.showList();
        },
        setData: function(data){
            config.resourse = data;
        },
        renderHTML: function (code) {
            var reg = /##renderHTML\[([\s\S]+?)\]##/g;
            try {
                var buts = [], pass = false;
                each(config.columns, function(item){
                    if(getType(item.buts) === "array"){
                        buts.push(item.buts);
                    }
                    if(!pass && getType(item.renderHTML) === "function"){
                        pass = true;
                    }
                });
                if(!pass) return code;
                return code.replace(reg, function (a, b) {
                    var obj = new Function("return " + b)();
                    if (getType(obj) === "object") {
                        var col = opts.columns[obj.cols];
                        var data = opts.data[obj.index];
                        var arrayButs = [];
                        each(buts, function(arr){
                            var oneButs = [];
                            each(arr, function(item){
                                var o = {};
                                if(getType(item.text) === "array"){
                                    if(getType(item.index) === "array"){
                                        o.text = item.text[item.index[obj.index]];
                                    }else{
                                        o.text = item.text[0];
                                    }
                                }else{
                                    o.text = item.text;
                                }
                                o.id = item.id;
                                o.data = item.data;
                                oneButs.push(o);
                            });
                            arrayButs.push(oneButs);
                        });

                        return sNull(col.renderHTML(data[obj.name], data, {
                            getButs: arrayButs,
                            buts: custFuncs.getButHTML
                        })).replace(/\<%=([\S\s]+?)\%>/g, function (a, b) {
                            return data[b.replace(/(^\s*)|(\s*$)/g, "")];
                        });
                    }
                    return "";
                });
            } catch (e) {
                return code.replace(reg, "");
            }
        },
        getButHTML: function (list) {
            var code = '';
            each([].concat(list), function (obj) {
                if (getType(obj) !== "object") return;
                code += obj.text;
            });
            return code;
        },
        setScrollTop: function(y) {
            nodeList.content.scrollTop = y;
        },
        resize: function(height){
            nodeList.content.style.height = height + config.rowHeight + "px";
            custFuncs.showList();
        }
    }

    //---------------暴露API----------------
    that.setOption = custFuncs.setOption;
    that.addColumns = custFuncs.addColumns;
    that.delColumns = custFuncs.delColumns;
    that.setData = custFuncs.setData;
    that.setScrollTop = custFuncs.setScrollTop;
    that.resize = custFuncs.resize;

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    return that;
}