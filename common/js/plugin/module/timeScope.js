/**
 * @author xx
 * @data 2016-09-18
 * @description 时间范围选择器
 */

module.exports = function(node, opts) {
  //----------------require--------------
  var base        = require('lib/comp/base');
  var parseModule = require('lib/dom/parseModule');
  var render = require("plugin/tmpl/timeScope.ejs");
  var addEvent    = require('lib/evt/add');
  var eventProxy    = require('lib/evt/proxy');
  var insertHTML    = require('lib/dom/insertHTML');
  var runtime     = require("plugin/runtime");
  var merge = require("lib/json/merge");
  var className = require("lib/dom/className");
  var each = require("lib/util/each");
  
  //-----------声明模块全局变量-------------
  var that        = base();
  var data        = null;
  var nodeList    = null;
  opts = merge({
        label: "剩余时间",
        data: [ //自定义约束：val = -1
            { text: "30天", val: 30 },
            { text: "60天", val: 60 },
            { text: "已过期", val: "" }
        ]
  }, opts || {});
  var curCheckedVal = null;  

  //-------------事件响应声明---------------
  var evtFuncs = {
    navChange: function(e) {
        var v = e.data.v;
        curCheckedVal = v;
        className.remove(nodeList.navItem, 'active');
        className.add(e.target, 'active');
        if(v == -1) {
            className.remove(nodeList.customBox, 'hide');
        } else {            
            className.add(nodeList.customBox, 'hide');
        }
        that.fire('change', custFuncs.getValue());
    },
    inputChange: function(e) {
        if(!/^\d+$/.test(e.target.value)) e.target.value = "";
        that.fire('change', custFuncs.getValue());
    },
    blurHandler (e) {   //截止天数不能大于起始天数
        if(nodeList.end.value*1 > 0 && nodeList.start.value*1 > nodeList.end.value*1) nodeList.end.value = nodeList.start.value;
        that.fire('change', custFuncs.getValue());
    }
  };

  //-------------绑定事件------------------
  var bindEvents = function() {
    addEvent(nodeList.start, 'keyup', evtFuncs.inputChange);
    addEvent(nodeList.end, 'keyup', evtFuncs.inputChange);
    addEvent(nodeList.start, 'blur', evtFuncs.blurHandler);
    addEvent(nodeList.end, 'blur', evtFuncs.blurHandler);
    eventProxy(node).add('nav', 'click', evtFuncs.navChange);
  };

  //-------------自定义函数----------------
  var custFuncs = {
    initView: function() {
        insertHTML(node, render(opts), 'afterbegin');
        nodeList = parseModule(node);

        custFuncs.setDefault();
    },
    setDefault: function() {    // 默认选择第一项
        curCheckedVal = opts.data[0].val;
        className.add(nodeList.customBox, 'hide');
        that.fire('change', custFuncs.getValue());
    },
    getValue: function() {  //组件外部可通过该方法获取当前值
        let res = {};               
        if(curCheckedVal == -1) {
            res.text = '自定义';
            res.val = [nodeList.start.value, nodeList.end.value];
        } else {
            each(opts.data, function(item) {
                if(item.val == curCheckedVal) {
                    res = item;
                    return false;
                }
            })
        }

        return res;
    }
  };

  //-------------子模块实例化---------------
  var initMod = function() {};

  //-------------一切从这开始--------------
  var init = function(_data) {
     data = _data;

     nodeList = parseModule(node);
     
     custFuncs.initView();
     
     bindEvents();
  };

  //---------------暴露API----------------
  that.init = init;
  that.getValue = custFuncs.getValue;

  return that;
};