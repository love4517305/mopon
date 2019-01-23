/**
 * @author benny.zheng
 * @data 2016-07-25
 * @description 弹层外壳
 * 注意：
 * header、footer以及close可有可无，不需要的话删除即可
 * box是必须的，同时它也将作为内容区的主体容器
 * box内部自行组织HTML，然后用这个组件做扩展写自己的事件
 * footer如果存在，允许传入buttons来为其中的按钮绑回调函数，按钮必须设置data-button="ok或者其它"
 * 同时buttons也可以传一个ok的函数来作为回调函数
 * 回调时，不自动关闭弹层
 * buttons被点击时也会触发一个叫buttonclick的事件，同时会传是谁被点击
 */

module.exports = function(opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var builder = require("lib/layer/builder");
    var merge = require("lib/json/merge");
    var sizzle = require("lib/dom/sizzle");
    var addEvent = require("lib/evt/add");
    var defaultTMPL = require("plugin/tmpl/dialog/default.ejs");
    var winSize = require("lib/util/winSize");
    var simScroll = require("plugin/module/simScroll");
    var moveLayer = require("plugin/module/moveLayer");

    //-----------声明模块全局变量-------------
    // 下边是默认值
    opts = merge({
        keepMiddle: true,
        title: "提示", // 当有头部时起效，允许为html
        HTML: null, // 整个弹层的HTML，如果不传模板，则使用defaultTMPL生成HTML
        header: true, // 是否拥有header，如果使用自定义template时失效
        close: true, // 是否拥有close，如果使用自定义template时失效
        footer: true, // 是否拥有footer，如果使用自定义template时失效
        boxHTML: null // 如果使用自定义template时失效，只有使用默认template时，允许传一段HTML进来设置为box的内容
        // 如果有footer，则允许传入footer中按钮的样式，同时可以绑定buttonclick事件监听这些按钮被点击事件。
        // ok和cancel可以在buttonclick触发时，通过ev.data.type来获取
        // 按钮配置的值如果是字符串，则直接把它当成显示的文字，如果传的对象，可以设置type为blue或者white（white是默认值)
        // buttons: [
        //    { "id": "ok", "text": "确定", "type": "blue" },
        //    { "id": "cancel", "text": "取消" } // 默认为white
        // ]
    }, opts || {});
    // //console.log(opts)
    var template = opts["HTML"];

    // 使用默认的模板
    if (template == null) {
        template = defaultTMPL({
            "header": !(opts["header"] === false),
            "footer": !(opts["footer"] === false),
            "close": !(opts["close"] === false),
            "html": opts["boxHTML"],
            "buttons": opts["buttons"],
            "height": opts["height"] ? opts["height"] : "auto"
        });
    }

    var nodeList = null; // 存储所有关键节点
    var that = builder.createFromHTML(template, opts);
    var node = that.getOuter();
    var m_simScroll = null;
    var m_moveLayer = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        close: function(ev) {
            that.hide("close");
        },
        buttonClick: function(ev) {
            var target = this;
            var data = {
                "type": target.getAttribute("data-button"),
                "button": target,
                "event": ev
            };

            that.fire("buttonclick", data);
        },
        show: function(){
            m_simScroll = simScroll(nodeList.box, {
                autoChange: true,
                horizontal: {
                    top: nodeList.header.offsetHeight
                }
            });
            m_simScroll.init();
            m_simScroll.loadScroll();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_moveLayer = moveLayer(nodeList.header, {
            layer: node
        });
        m_moveLayer.init();
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        var buttons = null;

        if (nodeList.close) {
            addEvent(nodeList.close, "click", evtFuncs.close);
        }

        if (nodeList.footer) {
            buttons = sizzle("[data-button]", nodeList.footer);
            addEvent(buttons, "click", evtFuncs.buttonClick);
        }

        that.bind("show", evtFuncs.show);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        initView: function() {
            custFuncs.setTitle(opts["title"]);
            var winHeight = winSize().height;
            nodeList.box.style.maxHeight = winHeight - 150 + "px";
            nodeList.box.style.overflowY = "auto";
            nodeList.box.style.overflowX = "hidden";
        },
        setTitle: function(title) {
            opts["title"] = title;
            if (nodeList.title) {
                nodeList.title.innerHTML = title;
            }
        },
        loadScroll: function(){
            m_simScroll.loadScroll();
        }
    }

    //---------------暴露API----------------
    that.setTitle = custFuncs.setTitle;
    that.loadScroll = custFuncs.loadScroll;

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();
    custFuncs.initView();

    return that;
}