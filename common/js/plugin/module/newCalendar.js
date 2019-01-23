/**
 * Created by carry on 2017/4/13.
 */
/**
 * 日历组件
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    // var calendar = require("lib/util/calendar");
    var render = require("plugin/tmpl/newCalendar.ejs");
    var each = require("lib/util/each");
    var addEvent = require("lib/evt/add");
    var eventProxy = require("lib/evt/proxy");
    // var removeEvent = require("lib/evt/remove");
    var className = require("lib/dom/className");
    var getPosition = require("lib/dom/getPosition");
    var merge = require("lib/json/merge");
    var sizzle = require("lib/dom/sizzle");
    var winSize = require("lib/util/winSize");
    var scrollPos = require("lib/util/scrollPos");
    var scrollBarSize = require("lib/dom/scrollBarSize");
    var stopPropagation = require("lib/evt/stopPropagation");
    var popup = require("lib/layer/popup");
    var closest = require("lib/dom/closest");
    var dateUtils = require("plugin/util/dateUtils")();
    // var scrollTo = require("lib/util/scrollTo");
    var tojson = require("lib/json/queryToJson");
    // var trim = require("lib/str/trim");

    opts = merge({
        "isYearAndMounth": true, //默认只显示 年-月
        "initValue": null, //仅支持传数组,格式yyyy-mm / yyyy/mm
        "formatter": null, //日期的输出格式，优先级最高，为空时以当前节点输出的格式，节点空则以默认输出格式
        "autoDirection": false,
        "autoHide": true,
        "before": true,//true 当前时间往前不能选
        "after": false,//true 当前时间往后不能选
        "disDate": null //格式yyyy-mm / yyyy/mm,  配合before和after使用；如有值则该日期前后不能选，否则当前日期前后不能选
    }, opts || {});

    //-----------声明模块全局变量-------------
    var that = popup(render(), opts);
    var superMethod = { show: that.show, hide: that.hide };
    var layeNode = that.getOuter();
    var nodeList = parseModule(layeNode);
    var callNodes = null; //存放需要调用日历的节点
    var isNull = false; //是否存在需要调用日历的节点，默认存在
    var curNode = null; //存放当前调用日历的节点
    var nodeValue = null;
    var months = [1,2,3,4,5,6,7,8,9,10,11,12];
    var year = null;
    var month = null;
    var yearStatu = null;
    var disDate = opts['disDate'] ? new Date((opts['disDate'].indexOf('-') != -1 ? opts['disDate'].replace('-', '/') : opts['disDate'])) : new Date();
    var disY = disDate.getFullYear(), disM = disDate.getMonth()+1;
    //-------------事件响应声明---------------s
    var evtFuncs = {
        showCalendar: function(e) {
            var target = closest(e.target || e.srcElement, '[data-type="calendar"]');            
            custFuncs.show(target)
            stopPropagation(e.originEvent || e);
        },
        changeDate: function(e) {
            var target = closest(e.target || e.srcElement, '[data-change]');
            stopPropagation(e.originEvent || e);
            if (!target) return;

            var type = target.getAttribute('data-change');

            var o = custFuncs.changeCalendar(type);
            year=o.y;month=o.m;
            custFuncs.setCurnodeValue(o);
            custFuncs.getMonthList();
        },
        toggleYear:function(){
            if(className.has(nodeList.yearList,"hide")){
                var num = Math.floor(year % 10);
                custFuncs.getYearList(year-num); 
                custFuncs.showYear();                                              
            }
        },
        toggleMonth:function(){
            if(className.has(nodeList.monthList,"hide")){
                custFuncs.getMonthList();
                custFuncs.showMonth();
            }
        },
        getVal:function(e){ 
            e = e? e: window.event
            var target = e.srcElement ? e.srcElement:e.target;  
            if(target==this) return;  
            if(className.has(target, 'disabled')) return;
            className.remove(sizzle("[data-mark=m]"),"cur");
            className.add(target,"cur");       
            if(this.getAttribute("node-name")=="yearBox"){
                nodeList.year.innerHTML=target.innerHTML;                 
                year=parseFloat(target.innerHTML);
                custFuncs.getMonthList(); 
                custFuncs.showMonth();                           
            }else{
                nodeList.month.innerHTML=target.innerHTML;
                month=parseFloat(target.innerHTML);
                custFuncs.hide();                                 
            }
            custFuncs.setCurnodeValue({y:year,m:month});            
        },
        changeYear:function(ev){
            var target = ev.target;
            var changeEvent = target.getAttribute("data-change");
            if (changeEvent == "lastYear") {
                yearStatu-=12;
            } else if (changeEvent == "nextYear") {
                yearStatu+=12;
            }
            custFuncs.getYearList(yearStatu); 
        }
    };

    //-------------子模块实例化---------------
    var initMod = function() {

    };

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(callNodes, "click", evtFuncs.showCalendar);
        addEvent(nodeList.year, "click", evtFuncs.toggleYear);
        addEvent(nodeList.month, "click", evtFuncs.toggleMonth);
        eventProxy(nodeList.change).add("change", "click", evtFuncs.changeYear);
        addEvent(nodeList.yearBox, "click", evtFuncs.getVal);
        addEvent(nodeList.monthBox, "click", evtFuncs.getVal);

    };
    //-------------自定义函数----------------
    var custFuncs = {
        init: function() {
            callNodes = Array.prototype.slice.call(sizzle('[data-type="calendar"]', node)); //收集调用日历的节点
            if (callNodes == null || callNodes.length == 0) {
                isNull = true;
                return
            }
            //父节点初始化,禁止外部修改默认值
            each(callNodes, function(node) {

                var json = custFuncs.getNodeJson(node);
                if (json.initValueIndex && opts.initValue && opts.initValue.length != 0 && opts.initValue[json.initValueIndex]) {
                    node.nodeName == "INPUT" ? node.value = opts.initValue[json.initValueIndex] : node.textContent = opts.initValue[json.initValueIndex];
                } else {
                    node.nodeName == "INPUT" ? node.value = '' : node.textContent = '';
                }
            })

        },
        getCurnodeValue: function() {
            return curNode.nodeName == "INPUT" ? curNode.value : curNode.textContent;
        },
        setCurnodeValue: function(o, first) {
            var dateStr;
            if (opts.isYearAndMounth) {
                var mlength, separator, formatter;
                var match = nodeValue.match(/^\d{1,4}(-|\/)\d{1,2}/g);
                var curNodeFormatter = match ? match[0] : null;
                if (opts.formatter && /(^y{1,4}-m{1,2}$)|(^y{1,4}\/m{1,2}$)/.test(opts.formatter)) {
                    formatter = opts.formatter;
                } else {
                    formatter = curNodeFormatter ? curNodeFormatter : 'yyyy-mm';
                }
                if (/^[a-z0-9]{1,4}-([a-z0-9]{1,2}$)/.test(formatter)) {
                    mlength = RegExp.$1.length > 1 ? 2 : 1;
                    separator = '-';
                } else if (/^[a-z0-9]{1,4}\/([a-z0-9]{1,2}$)/.test(formatter)) {
                    mlength = RegExp.$1.length > 1 ? 2 : 1;
                    separator = '/';
                }
                if (mlength == 2) {
                    dateStr = o.m < 10 ? o.y + separator + '0' + o.m : o.y + separator + o.m;
                } else {
                    dateStr = o.y + separator + o.m;
                }

            }
            curNode.nodeName == "INPUT" ? curNode.value = dateStr : curNode.textContent = dateStr;
            !first && that.fire('selecteOver', {
                target: curNode,
                value: dateStr
            })
        },
        getNodeJson: function(node) {
            return tojson(node.getAttribute('data-json'));
        },
        initCalendarDate: function(value) {
            value = value.toString();
            if (/^\d{1,4}(\-|\/)\d{1,2}$/.test(value)) {
                value = value + RegExp.$1 + '3';
            }
            var times = value ? dateUtils.parse(value) : new Date();
            var y = times.getFullYear();
            var m = times.getMonth() + 1;
            var o = {
                y: y,
                m: m
            }
            custFuncs.setYear(o.y)
            custFuncs.setMonth(o.m)
            if (opts.isYearAndMounth) return o;
        },
        changeCalendar: function(type) {
            switch (type) {
                case "lastYear":
                    custFuncs.setYear(custFuncs.getYear() - 1);
                    if (custFuncs.getYear() < 0) {
                        ustFuncs.setYear(0)
                    }
                    break
                case "nextYear":
                    custFuncs.setYear(custFuncs.getYear() + 1);
                    break
                case "lastMonth":
                    if (custFuncs.getMonth() <= 1) {
                        custFuncs.setMonth(12);
                    } else {
                        custFuncs.setMonth(custFuncs.getMonth() - 1);
                    }
                    break
                case "nextMonth":
                    if (custFuncs.getMonth() >= 12) {
                        custFuncs.setMonth(1);
                    } else {
                        custFuncs.setMonth(custFuncs.getMonth() + 1);
                    }
                    break
            }
            return {
                y: custFuncs.getYear(),
                m: custFuncs.getMonth()
            }
        },
        setYear: function(value) {
            nodeList.year.textContent = value+"年";
            year=value;
        },
        getYear: function() {
            return parseFloat(nodeList.year.textContent);
        },
        setMonth: function(value) {
            nodeList.month.textContent = value+"月";
            month = value;
        },
        getMonth: function() {
            return parseFloat(nodeList.month.textContent);
        },
        show: function(target) {
            curNode = target;
            nodeValue = custFuncs.getCurnodeValue();
            if (that.getStatus()) {
                custFuncs.hide();
            }
            var o = custFuncs.initCalendarDate(nodeValue);
            custFuncs.getMonthList();
            //获取节点信息，计算日历显示位置
            var x, y;
            var parentNodeSize = {
                width: target.offsetWidth,
                height: target.offsetHeight
            }
            document.body.appendChild(layeNode);
            var layerNodeSize = {
                width: layeNode.offsetWidth,
                height: layeNode.offsetHeight
            }
            document.body.removeChild(layeNode);
            var clientSize = winSize();
            var scroll = scrollPos();
            var barSize = scrollBarSize();
            var pos = getPosition(target);            
            var params = {
                x: pos.left,
                y: pos.top,
                clientWidth: clientSize.width,
                clientHeight: clientSize.height,
                PnodeWidth: parentNodeSize.width,
                PnodeHeight: parentNodeSize.height,
                layerNodeWidth: layerNodeSize.width,
                layerNodeHeight: layerNodeSize.height,
                scrollLeft: scroll.left,
                scrollTop: scroll.top,
                barH: barSize.h,
                barV: barSize.v
            }

            if (params.y - params.scrollTop > params.layerNodeHeight) {
                x = params.x;
                y = params.y - params.layerNodeHeight;
            } else {
                x = params.x;
                y = params.y + params.PnodeHeight;
            }
            
            superMethod.show.call(that, x, y, {
                beforeAnimate: function() {
                    if (!nodeValue) {
                        custFuncs.setCurnodeValue(o, true)
                    }
                }
            })
            custFuncs.showMonth();            
        },
        hide: function(why, extra, handlers) {
            superMethod.hide.call(that, why, extra, handlers)
        },
        getMonthList:function(){     
            var html = "",className = "",cur = ""; 
            months.forEach(function(item,i) {             
                className = ""; 
                if(((item < disM && year == disY) || (year < disY)) && opts['before']) className = 'disabled';       
                if(((item > disM && year == disY) || (year > disY)) && opts['after']) className = 'disabled';       
                if(item == month){

                    className += " cur";
                    cur = '<i></i>';
                }else{
                    className += "";
                    cur="";
                }
                html += "<p class='"+className+"' data-mark='m'>"+item+"月"+cur+"</p>";
            });
            nodeList.monthBox.innerHTML=html;            
        },
        getYearList:function(n){
            var num = null,arr = [],html="",i=n,className="",cur="";   
            yearStatu = n;            
            while (arr.length < 12) {
                className = ""
                if(i < disY && opts['before']) className = 'disabled';       
                if(i > disY && opts['after']) className = 'disabled';
                
                if(year == i){
                    className += " cur";
                    cur = "<i></i>";
                }else{
                    className += "";
                    cur = "";
                }
                html += "<p class='"+className+"' data-mark='m'>"+i+"年"+cur+"</p>"; 
                i++;
                arr.push(i);
            }            
            nodeList.yearBox.innerHTML=html;
        },
        showYear:function(){
            className.remove(nodeList.yearList,"hide"); 
            className.add(nodeList.monthList,"hide");
            className.remove(nodeList.changeNav,"hide");
        },
        showMonth:function(){
            className.add(nodeList.yearList,"hide"); 
            className.remove(nodeList.monthList,"hide");
            className.add(nodeList.changeNav,"hide");
        }
    };

    //-------------一切从这开始--------------
    var init = function(_data) {
        //进来首先初始化需调用日历的节点
        custFuncs.init();
        if (isNull) return;
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    };
    init();
    //---------------暴露API----------------

    return that;
};