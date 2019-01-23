/**
 * @author 璩
 * @data 2016-08-19
 * @description 连动下拉
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var select = require("plugin/module/dropmenu");
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var merge = require("lib/json/merge");
    var queryToJson = require("lib/json/queryToJson");
    var when = require("lib/util/when");
    var ajax = require("lib/io/ajax");
    var filter = require("plugin/util/filterData");
    var isNode = require("lib/dom/isNode");

    //-----------声明模块全局变量-------------
    var nodeList = node; // 存储所有关键节点
    var that = base();
    var data = null;
    var map = null;
    var ldArray = {};

    opts = merge({map: {}, method: "post", selectIndex: -1}, opts || {});
        /*{map: {}, method: "post", options: {
            "mark": [
                {
                    url: "",
                    filter: {name: "", key: "key", val: "val"}
                },
                {
                    url: "",
                    filter: {name: "", key: "key", val: "val"},
                    data: {params: {"xx": "$mark[0]"}}
                }
            ]
        }};*/

    //-------------事件响应声明---------------
    var evtFuncs = {
        dropMenuChosed: function(evt){
            var data = evt.data;
            var mapKey = data.ld ? data.ld.sign + "_" + data.ld.index : "";
            that.fire(data.id || "selectChange", {
                rawData: map[mapKey] ? map[mapKey][data.key] || {} : {},
                key: data.key,
                val: data.val,
                node: data.node
            });

            if(data.ld){
                var sign = data.ld.sign;
                var index = parseInt(data.ld.index);
                ldArray[sign][index].curValue = {key: data.key, val: data.val};
                var obj = ldArray[sign][index + 1];
                if(obj){
                    custFuncs.loadSelect(obj, {key: data.key, sign: sign, index: index + 2});
                }
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {}

    //-------------自定义函数----------------
    var custFuncs = {
        trigger: function(sign, index){
            var obj = ldArray[sign][index];
            if(obj){
                var parentObj = ldArray[sign][index - 1];
                var key = parentObj ? parentObj.curValue.key : "";
                custFuncs.loadSelect(obj, {key: key, sign: sign, index: index + 1});
            }
        },
        getDropBox: function(sign, index){
            var obj = ldArray[sign][index];
            if(obj){
                return obj.mod;
            }
            return null;
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
        loadSelect: function(obj, config){
            var data = opts.options[obj.data.sign][obj.data.index];
            var mapKey = obj.data.sign + "_" + obj.data.index;
            if(data.url || data.dataSource){
                if(config && config.key == ""){
                    custFuncs.showSelect(null, data, obj.mod, mapKey);
                    var index = config.index;
                    var next = ldArray[config.sign][index];
                    while(next){
                        index ++;
                        custFuncs.showSelect(null, opts.options[next.data.sign][next.data.index], next.mod, mapKey);
                        next = ldArray[config.sign][index];
                    }
                    return;
                }
                if(data.dataSource){
                    custFuncs.showSelect(data.dataSource, data, obj.mod, mapKey);
                }else if(data.url){
                    custFuncs.postData(data.url, custFuncs.formatJSON(custFuncs.getDomData(custFuncs.clone(data.data))), data.method || opts.method)
                        .then(function(res){
                            custFuncs.showSelect(res, data, obj.mod, mapKey);
                            that.fire('loaded',{ index: obj.data.index });    //select加载完成
                        });
                }
            }
        },
        showSelect: function(res, data, mod, mapKey){
            var list = custFuncs.formatData(filter(res, data.filter.name), data.filter.key || "key", data.filter.val || "val", mapKey);
            mod.loadData({
                selectMenuData: {
                    "selectItems": list
                }
            });
            if(typeof data.value != "undefined" || typeof data.selectIndex != "undefined"){
                mod.setDefaultValue(true, data.value, data.selectIndex);
            }
        },
        formatData: function(data, key, val, mapKey){
            var arr = [];
            if(getType(data) == "object"){
                each(data, function(v, k){
                    if (k != '') {
                        arr.push({key: k, val: v});
                    }
                });
            }else if(getType(data) == "array"){
                each(data, function(v, index){
                    if (data[index][key] != '') {
                        arr.push({
                            key: data[index][key],
                            val: data[index][val]
                        });
                    }
                    map[mapKey][data[index][key]] = data[index];
                });
            }
            return arr;
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
                    var reg = /^\$([\s\S]+?)\[([\s\S]+?)\]\.([\s\S]+?)$/g;
                    if(reg.test(v)){
                        try{
                            var obj = ldArray[RegExp.$1][RegExp.$2];
                            if(obj){
                                data[k] = obj.curValue[RegExp.$3];
                            }
                        }catch(e){}
                    }
                }else if(isNode(v)){
                    data[k] = v.value;
                }
            });
            return data;
        },
        ldSelect: function(){
            each(ldArray, function(v){
                each(v, function(v1, k1){
                    if(k1 == 0){
                        custFuncs.loadSelect(v1);
                    }
                });
            });
        },
        initView: function(){
            nodeList = [].concat(node);
            map = {};
            each(nodeList, function(item){
                var data = custFuncs.getSelect(item);
                var m_select = select(item, {id: data.id, ld: data.type == "ld" ? {sign: data.sign, index: data.index} : null});
                var bool = data.type == "ld";
                if(bool){
                    if(!ldArray[data.sign]) ldArray[data.sign] = [];
                    ldArray[data.sign][data.index] = {data: data, mod: m_select, curValue: {}};
                    map[data.sign + "_" + data.index] = {};
                }
                m_select.bind("dropMenuChosed", evtFuncs.dropMenuChosed);
                m_select.init();
                if(!bool){
                    m_select.loadData({
                        selectMenuData: {
                            "selectItems": opts.map[data.key] || []
                        }
                    });
                    if(opts.selectIndex >= 0){
                        m_select.setDefaultValue(true, null, opts.selectIndex);
                    }
                }
            });
            custFuncs.ldSelect();
        },
        getSelect: function(item){
            var key = item.getAttribute("data-key");
            var data = item.getAttribute("data-select");
            if(key && data){
                return merge({key: key}, queryToJson(data));
            }else if(key){
                return {key: key};
            }else if(data){
                return queryToJson(data);
            }
            return {};
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 子模块实例化
        initMod();
        custFuncs.initView();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;
    that.trigger = custFuncs.trigger;
    that.getDropBox = custFuncs.getDropBox;

    return that;
};