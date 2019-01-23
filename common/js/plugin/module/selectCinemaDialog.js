/**
 选择影院 by璩
 */
module.exports = function(opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var className = require("lib/dom/className");
    var runtime = require("plugin/runtime");
    var ajax = require("lib/io/ajax");
    var dialogManager = require("plugin/dialog/frameDialogManager");
    var dialog = dialogManager.getDialog("plugin/dialog/dialog");
    var search = require("plugin/module/searchBase");
    var render = require("plugin/tmpl/selectCinema.ejs");
    var when = require("lib/util/when");
    var tree = require("plugin/module/mTree");
    var autoComplete = require("plugin/module/autoComplete");
    var addEvent = require('lib/evt/add');
    var merge = require("lib/json/merge");
    
    //-----------声明模块全局变量-------------
    //returnHalls 默认为true，带影厅false为不带，snackId是影院ID，选中用
    //returnSnacks 注意“和是否带影厅互斥”！！！默认为false，不带卖品，带卖品为true
    opts = merge({returnHalls: true, returnSnacks: false, typeId: "", title: "选择影院", selectData: [], disabled: false, disabledSet: false,selectType: "checkbox"}, opts);

    var config = {
        title: opts.title,
        boxHTML: render({}),
        buttons: [
            { "id": "ok", "text": "保存" , "type": "blue"},
            { "id": "cancel", "text": "关闭" }
        ]
    };

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = dialog(config);
    var node = that.getOuter();
    var m_search = null;
    var m_tree = null;

    //-------------事件响应声明---------------
    var evtFuncs = {
        search: function(evt){
            if(nodeList.cinemaName.getAttribute("data-code")){
                m_tree.location(nodeList.cinemaName.getAttribute("data-code"));
            }else if(nodeList.city.getAttribute("data-code")){
                m_tree.location(nodeList.city.getAttribute("data-code"));
            }
        },
        show: function(){
            m_search.init();

            var m_autoComplete1 = autoComplete(nodeList.city, {
                blur: true,
                url: "proxy/base/site/baseinfo/v1/searchCityorCinema",
                filter: {name: "data.group"},
                data: {cityString: "$text"}
            });
            m_autoComplete1.init();
            m_autoComplete1.bind("select", evtFuncs.autoSelect);

            var m_autoComplete2 = autoComplete(nodeList.cinemaName, {
                blur: true,
                url: "proxy/base/site/baseinfo/v1/searchCityorCinema",
                filter: {name: "data.group"},
                data: {cinemaName: "$text"}
            });
            m_autoComplete2.init();
            m_autoComplete2.bind("select", evtFuncs.autoSelect);
        },
        buttonClick: function(evt){
            if(evt.data.type == "ok"){
                var result = m_tree.getSelectData(false);
                var tree = m_tree.getTreeSelectData(false);
                that.fire("submit", {result: result, tree: tree});
                that.hide("ok");
            }else if(evt.data.type == "cancel"){
                that.hide("cancel");
            }
        },
        unDisabled: function(e){
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            className.remove(elem, "disabled");
        },
        disabled: function(e){
            setTimeout(function() {
                var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
                if(!elem.getAttribute("data-code") && elem.value != ""){
                    className.add(elem, "disabled");
                }else if(elem.getAttribute("data-code")){
                    if(elem == nodeList.city){
                        nodeList.cinemaName.removeAttribute("data-code");
                        nodeList.cinemaName.value = "";
                        className.remove(nodeList.cinemaName, "disabled");
                    }else{
                        nodeList.city.removeAttribute("data-code");
                        nodeList.city.value = "";
                        className.remove(nodeList.city, "disabled");
                    }
                }else if(elem.value == ""){
    				elem.removeAttribute("data-code");
    				className.remove(elem, "disabled");
    			}
            },
            200);
        },
        autoSelect: function(evt){
            if(evt.data.type == "default"){
                evt.data.node.removeAttribute("data-code");
            }else{
                evt.data.node.setAttribute("data-code", evt.data.key);
                className.remove(evt.data.node, "disabled");
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {
        m_tree = tree(nodeList.treeBox, {
            title: {text: "全选"},
            filter: {text: "name"},
            tiled: {child: "halls", width: 80},
            checkParents: true,
            selectType: opts.selectType
        });
        m_tree.init();
        m_search = search(nodeList.searchBox);
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        that.bind("show", evtFuncs.show);
        m_search.bind("search", evtFuncs.search);
        that.bind("buttonclick", evtFuncs.buttonClick);
        addEvent(nodeList.city, "focus", evtFuncs.unDisabled);
        addEvent(nodeList.city, "blur", evtFuncs.disabled);
        addEvent(nodeList.cinemaName, "focus", evtFuncs.unDisabled);
        addEvent(nodeList.cinemaName, "blur", evtFuncs.disabled);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        setSelectData: function(){
            if(opts.typeId == "") return;
            ajax({
                url: "/proxy/good/site/snack/v1/match_cinemas_halls",
                data: {typeId: opts.typeId},
                method: "post",
                onSuccess: function(res){
                    if(res.code == 0){
                        m_tree.selectTreeItems(res.data, true, opts.disabledSet);
                    }else {
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
        },
        getTreeData: function(){
            var params = {returnHalls: opts.returnHalls};
            var defaultUrl = "/proxy/base/site/baseinfo/v1/cinema_tree";

            if(opts.returnSnacks) {
                defaultUrl = "/proxy/card/site/baseinfo/v1/snack_tree";
                params = null;
            }

            var defer = when.defer();
            ajax({
                url: defaultUrl,
                data: params,
                method: "post",
                onSuccess: function(res){
                    if(res.code == 0){
                        defer.resolve(res);
                    }else {
                        defer.reject(res.msg);
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    defer.reject(req);
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        initView: function(){
            custFuncs.getTreeData(true)
                .then(function(res){
                    m_tree.insertTreeItems(res.data);
                    custFuncs.setSelectData();
                    if(opts.selectData.length > 0){
                        m_tree.selectTreeItems(opts.selectData, true, opts.disabled);
                    }
                });
        }
    }

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);

    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    custFuncs.initView();

    //---------------暴露API----------------
    return that;
};