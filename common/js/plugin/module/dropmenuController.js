/**
 * @author chenshuqi
 * 下拉框组织者
 */

module.exports = function(module, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var ajax = require("lib/io/ajax");
    var isNode = require("lib/dom/isNode");
    var merge = require("lib/json/merge");
    var getType = require("lib/util/getType");
    var each = require("lib/util/each");
    var filter = require("plugin/util/filterData");
    var runtime = require('plugin/runtime');

    opts = merge({
        "type": 'key' //联动下拉框的关联类型，有key和value。key则为选项的值，value则为选项的文本
        // map: [{
        //     index: 0,
        //     key: '',
        //     val: ''
        // }]
        // options: [{
        //     固定下拉框的选项，当传入此参数，则不通过接口获取下拉框值:
        //     staticOptions: [{
        //          key: '1',
        //          val: '1'
        //     }]

        //     无staticOptions时为必须，接口地址：
        //     url: '/proxy/adp/codeList/queryListCombobox',

        //     非必须，接口参数：
        //     params: {
        //         "codeTypeValue": "FBJM",
        //         "isAll": "true"
        //     },

        //     无staticOptions时为必须，接口返回的字段，对应下拉框的选项值：
        //     keyName: 'codeTypeValue',

        //     无staticOptions时为必须，接口返回的字段，对应下拉框的选项文本：
        //     valName: 'codeLabel',

        //     联动中，受影响的参数字段
        //     relatedName: 'issueType',

        //     联动中，不受联动的参数字段。可传一个固定参数，也可传另一个下拉框的节点，每次会获取该下拉框节点作为参数值
        //     defaultParams: {
        //        'groupID': nodeList.groupSelect
        //     },

        //     非必须，将参数转化为字符串，并赋值给该字段，然后作为参数传给后台：
        //     format: 'params'
        //
        // }]
    }, opts || {});

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var modules = null;
    var map = [];
    var isFinishInit = false;

    //-------------事件响应声明---------------
    var evtFuncs = {}

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        for (var i = 0; i < modules.length - 1; i++) {
            (function(index) {
                modules[index].bind('dropMenuChosed', function(e) {
                    for (var j = index + 1; j < modules.length; j++) {
                        var options = opts.options[j]
                        var params = options.params || {};
                        var curMap = null;
                        if (map.length > 0) {
                            for (var i = 0; i < map.length; i++) {
                                if (map[i].index == index) {
                                    curMap = map[i];
                                }
                                break;
                            }
                        }
                        if (curMap) {
                            params[options.relatedName] = curMap[e.data[opts.type]];
                        }
                        else {
                            params[options.relatedName] = e.data[opts.type];
                        }
                        custFuncs.getData(options.url, params, options.keyName, options.valName, j, options.name)
                    }
                })
            })(i)
        }
    }

    //-------------自定义函数----------------
    var custFuncs = {
        formatData: function(data, name, keyName, valName) {
            var formattedData = [];
            if(name) {
                data = filter(data, name);
            }

            if(getType(data) == "object"){
                each(data, function(v, k){
                    if (k != '') {
                        formattedData.push({
                            key: k,
                            val: v
                        });
                    }
                });
            }else{
                for (var i = 0; i < data.length; i++) {
                    if (data[i][keyName] != '') {
                        formattedData.push({
                            key: data[i][keyName],
                            val: data[i][valName]
                        });
                    }
                }
            }
            return formattedData;
        },

        initSelect: function() {
            var params = null;
            var defaultParams = null;
            // for (var i = 0; i < modules.length; i++) {
            //     var isInit = modules[i].getOuter().getAttribute('data-init');
            //     if (isInit == 'inited') {
            //         return;
            //     }
            //     if (isInit == 'init') {
            //         modules[i].getOuter().setAttribute('data-init', 'inited');
            //     }
            //     if (opts.options[i].staticOptions) {
            //         modules[i].loadData({
            //             selectMenuData: {
            //                 "selectItems": opts.options[i].staticOptions
            //             }
            //         })
            //         return;
            //     }
            //     params = opts.options[i].params;

            //     custFuncs.getData(opts.options[i].url, params, opts.options[i].keyName, opts.options[i].valName, i, opts.options[i].name);
            // }
            var option = opts.options[0];
            if (option.staticOptions) {
                modules[0].loadData({
                    selectMenuData: {
                        "selectItems": option.staticOptions
                    }
                })
                return;
            }
            params = option.params;

            custFuncs.getData(option.url, params, option.keyName, option.valName, 0, option.name);
        },
        getData: function(url, params, keyName, valName, curIndex, name) {
            var formattedparams = {};
            var defaultParams = null;
            defaultParams = opts.options[curIndex].defaultParams
            params = params || {};
            if (defaultParams) {
                for (var key in defaultParams) {
                    if (defaultParams.hasOwnProperty(key)) {
                        if (isNode(defaultParams[key])) {
                            params[key] = defaultParams[key].getAttribute('data-' + opts.type);
                        }
                        else {
                            params[key] = defaultParams[key];
                        }
                    }
                }
            }
            if (opts.options[curIndex].format) {
                formattedparams[opts.options[curIndex].format] = JSON.stringify(params);
            }
            else {
                formattedparams = params;
            }
            ajax({
                url: url,
                method: 'post',
                data: formattedparams,
                onSuccess: function(res) {
                    if (res.code != 0) {
                        return;
                    }

                    var result = null;

                    if ((keyName != null && valName != null) || name != null) {
                        result = custFuncs.formatData(name ? res : res.data, name, keyName, valName);
                    }
                    else {
                        result = res.data.codeList;
                    }

                    modules[curIndex].loadData({
                        selectMenuData: {
                            "selectItems": result
                        }
                    })
                    modules[curIndex].setDefaultValue(opts.options[curIndex].setDefaultValue, opts.options[curIndex].defaultValue, opts.options[curIndex].defaultIndex);
                    if (opts.map) {
                        for (var i = 0; i < opts.map.length; i++) {
                            var curMap = {};
                            if (opts.map[i].index != curIndex) {
                                return;
                            }
                            curMap.index = curIndex;
                            for (var j = 0; j < res.data.length; j++) {
                                curMap[res.data[j][opts.map[i].key]] = res.data[j][opts.map[i].val];
                            }
                            map.push(curMap);
                        }
                    }
                    if (!isFinishInit && curIndex == modules.length - 1) {
                        isFinishInit = true;
                        that.fire('initFinish',res);
                    }
                },
                onError: function(req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            })
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 根据数据初始化模块
        // opts["render"]({ "title": data["title"] });

        modules = [].concat(module);
        // 找到所有带有node-name的节点
        // nodeList = parseModule(node);
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
        custFuncs.initSelect();
    }

    //---------------暴露API----------------
    that.init = init;

    return that;
};