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

    opts = merge({
        method: "post",
        maxRows: 10,//最大行数
        top: 0,
        left: -1,
        blur: false,//非模糊查
        data: {},
        filter: {},
        fire: {},
        width: null,
        itemHeight: 28//每行高度
    }, opts || {});

    //-------------事件响应声明---------------
    var evtFuncs = {
        scroll : function(){
            if(isRun) isScroll = true;
            isRun = true;
        },
        autoComplete : function(e){
            if(e.keyCode == 38 || e.keyCode == 40) return;
            var val = node.value;
            if(opts.url == "" || val == "" || val == node.getAttribute("placeholder")){
                m_box.hide();
                return;
            }

            var pos = getPosition(node);
            var x = pos.left + parseInt(opts.left);
            var y = pos.top + parseInt(opts.top) + node.offsetHeight;
            nodeList.box.style.width = opts.width != null ? parseInt(opts.width) + "px" : node.offsetWidth + "px";

            if(val == lastValue) {
                if(m_box.getStatus()) return;
                else if(nodeList.box.innerHTML != ""){
                    m_box.show(x, y);
                    that.fire("show",{ node: nodeList.box});//添加
                    return;
                }
            }

            lastValue = val;

            that.fire("select", {val: lastValue, key: -1, type: "default", node: node});

            custFuncs.postData(opts.url, custFuncs.formatJSON(custFuncs.getDomData(custFuncs.clone(opts.data))), opts.method)
                .then(function(res){
                    nodeList.box.innerHTML = "";
                    m_box.hide();
                    var list = custFuncs.formatData(filter(res, opts.filter.name), opts.filter.key || "key", opts.filter.val || "val");
                    if(list.length == 0) return;
                    nodeList.box.innerHTML = custFuncs.getItemsHTML(list);
                    nodeList.items = opra.childNodes(nodeList.box);
                    m_box.show(x, y);
                    that.fire("show",{ node: nodeList.box});//添加
                });
        },
        keyDown : function(e){
            if(!m_box.getStatus() || !nodeList.items) return;
            var k = e.keyCode;
            var len = nodeList.items.length;
            if(k==38){  //↑
                selectIndex = --selectIndex < -1 ? len - 1 : selectIndex;
                custFuncs.pos(k);
            }else if (k == 40) {//↓
                selectIndex = ++selectIndex >= len ? -1 : selectIndex;
                custFuncs.pos(k);
            }else if(k==13){ //enter
                if(selectIndex == -1) return;
                var self = nodeList.items[selectIndex];
                var text = self.getAttribute("data-text");
                var key = self.getAttribute("data-key");
                node.value = text;
                node.blur();
                m_box.hide();
                that.fire("select", merge(custFuncs.getFire(key), {type: "ok", key: key, val: text, node: node}));
            }
        },
        selectItem: function(evt){
            var text = evt.target.getAttribute("data-text");
            var key = evt.target.getAttribute("data-key");
            node.value = text;
            m_box.hide();
            that.fire("select", merge(custFuncs.getFire(key), {type: "ok", key: key, val: text, node: node}));
        },
        hide: function(){
            selectIndex = -1;
            isScroll = false;
            isRun = false;
        },
        removeSelected: function(){
            className.remove(nodeList.items, "selected");
        },
        hideBox: function(e){
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
            var name = elem.nodeName.toLowerCase();
            if(name == "input") return;
            m_box.hide();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {};

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(m_box.getOuter(), "scroll", evtFuncs.scroll);
        addEvent(nodeList.box, "mouseover", evtFuncs.removeSelected);
        addEvent(node, "keyup", evtFuncs.autoComplete);
        addEvent(node, "click", evtFuncs.autoComplete);
        addEvent(node, "keydown", evtFuncs.keyDown);
        eventProxy(nodeList.box).add("item", "click", evtFuncs.selectItem);
        m_box.bind("hide", evtFuncs.hide);
        addEvent(document.body, "click", evtFuncs.hideBox);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        createHTML : function(){
            m_box = popup("<div class='m-autoComplete'><ul node-name='box'></ul></div>");
            nodeList = parseModule(m_box.getOuter());
            var h = parseInt(opts.itemHeight);
            nodeList.box.style.maxHeight = h * opts.maxRows + "px";
        },
        getItemsHTML: function(list){
            var code = '';
            var val = node.value;
            var len = val.length;
            var h = parseInt(opts.itemHeight);
            each(list, function(item){
                var result = item.val;
                if(opts.blur){
                    var reg = new RegExp(val, "g");
                    result = result.replace(reg, function(a){
                        return '<em style="color:#E91E63;">'+ a +'</em>';
                    });
                }else{
                    result = '<em>'+ result.substr(0, len) +'</em>'+ result.substr(len);
                }
                code += '<li data-action="item" data-key="'+ item.key +'" style="height: '+ h +'px;line-height: '+ h +'px" data-text="'+ item.val +'">' + result + '</li>';
            });

            return code;
        },
        getFire: function(key){
            var obj = {};
            if(getType(opts.fire) == "object" && map != null){
                each(opts.fire, function(v, k){
                    var reg = /^\$([\s\S]+?)$/;
                    if(reg.test(v)){
                        obj[k] = map[key][RegExp.$1];
                    }
                });
            }
            return obj;
        },
        clone: function(data){
            var obj = getType(data) == "array" ? [] : {};
            each(data, function(v, k){
                if(getType(v) == "object" || getType(v) == "array"){
                    obj[k] = custFuncs.clone(v);
                }else{
                    obj[k] = v;
                }
            });
            return obj;
        },
        formatJSON: function(data){
            each(data, function(v, k){
                if(getType(v) == "object" || getType(v) == "array"){
                    data[k] = JSON.stringify(v);
                }
            });
            return data;
        },
        getDomData: function(data){
            if(!data) return {};
            each(data, function(v, k){
                if(getType(v) == "object" || getType(v) == "array"){
                    data[k] = custFuncs.getDomData(v);
                }else if(getType(v) == "string"){
                    var reg = /^\$(text)$/;
                    if(reg.test(v)){
                        data[k] = node.value;
                    }
                }else if(isNode(v)){
                    data[k] = v.value;
                }
            });
            return data;
        },
        postData: function(url, data, method){
            var defer = when.defer();
            ajax({
                url: url,
                data: data,
                method: method,
                onSuccess: function(res) {
                    if (res.code == 0) {
                        defer.resolve(res);
                    }else{
                        defer.reject(res.msg);
                    }
                },
                onError: function(req) {
                    defer.reject(runtime.getHttpErrorMessage(req))
                }
            });
            return defer.promise;
        },
        formatData: function(data, key, val){
            var arr = [];
            map = {};
            if(getType(data) == "object"){
                each(data, function(v, k){
                    if (k != '') {
                        map[k] = v;
                        arr.push({key: k, val: v});
                    }
                });
            }else if(getType(data) == "array"){
                each(data, function(v, index){
                    if(getType(v) == "object"){
                        map[v[key]] = v;
                        arr.push({
                            key: v[key],
                            val: v[val]
                        })
                    }else{
                        map[index] = v;
                        arr.push({
                            key: index,
                            val: v
                        });
                    }
                });
            }else{
                map = null;
            }
            return arr;
        },
        pos: function(k){
            var outer = m_box.getOuter();

            className.remove(nodeList.items, "selected");

            if(selectIndex != -1){
                className.add(nodeList.items[selectIndex], "selected");
            }
            var h = parseInt(opts.itemHeight);
            var top = Math.round(outer.scrollTop / h);
            var count = opts.maxRows;
            isRun = false;
            if(isScroll){
                isScroll = false;
                outer.scrollTop = (selectIndex - count + 1) * h;
            }
            if(selectIndex == -1){
                outer.scrollTop = 0;
                node.value = lastValue;
                that.fire("select", {val: lastValue, key: -1, type: "default", node: node});
                return;
            }else if(selectIndex == 0){
                outer.scrollTop = 0;
            }else if((selectIndex - top >= count && k == 40) || selectIndex == nodeList.items.length - 1){
                outer.scrollTop = (selectIndex - count + 1) * h;
            }else if(k == 38 && selectIndex < top){
                outer.scrollTop = outer.scrollTop - h;
            }
            var self = nodeList.items[selectIndex];
            var text = self.getAttribute("data-text");
            var key = self.getAttribute("data-key");
            node.value = text;
            that.fire("select", merge(custFuncs.getFire(key), {type: "select", key: key, val: text, node: node}));
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