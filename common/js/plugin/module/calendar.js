/**
 * Created by zoe on 2016/7/20.
 */
/**
 * 日历组件
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var calendar = require("lib/util/calendar");
    var render = require("plugin/tmpl/calendar.ejs");
    var each = require("lib/util/each");
    var eventProxy = require("lib/evt/proxy");
    var addEvent = require("lib/evt/add");
    var removeEvent = require("lib/evt/remove");
    var className = require("lib/dom/className");
    var merge = require("lib/json/merge");
    var sizzle = require("lib/dom/sizzle");
    var scrollPos = require("lib/util/scrollPos");
    var scrollBarSize = require("lib/dom/scrollBarSize");
    var popup = require("lib/layer/popup");
    var closest = require("lib/dom/closest");
    var scrollTo = require("lib/util/scrollTo");
    var trim = require("lib/str/trim");
    // require("plugin/scss/calendar.scss");
    opts = merge({
        "layer": true, //默认为浮层
        "timeDetail": false, //默认不显示时分
        "initValue": null, //初始值yyyy-MM-dd hh:mm，默认为当前时间
        "initTime":null,//初始值 hh:mm  默认为当前时间
        "format": "%yyyy-%MM-%dd", //默认选中的日期的输出的格式%yyyy-%MM-%dd
        "attr": "data-input", //若父节点中有1个以上的input，在需要操作的input上加上属性，默认为data-input，若无此属性，默认选择第一个
        "width": null, //日历的宽度，为浮层时，日历的宽度默认为当前input的宽度，不为浮层时，日历的宽度默认为250px
        "before": true, //是否当天之前日期不允许选择，默认允许
        "after": true, //是否当天之后的日期不允许选择，默认允许
        "showDay": true,//默认显示天
        "selDate": function(curDate, timeDetail, inputNode) {} //curDate为选中的日期,timeDetail为带时分的时间，inputNode为当前展示日历的input
    }, opts || {});

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var now = new Date();
    var cal = calendar();
    // var monthList = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
    var monthList = [1,2,3,4,5,6,7,8,9,10,11,12];
    var curDate = null;
    var dates = null;
    var isLayer = opts["layer"];
    var timeDetail = opts["timeDetail"];
    var format = opts["format"];
    var initValue = opts["initValue"];
    var pNode = opts["pNode"];
    var initYear = null;
    var initMonth = null;
    var initDate = null;
    var year = null;
    var month = null;
    var date = null;
    var initHour = null;
    var initMinute = null;
    var hour = null;
    var minute = null;
    var m_cal = null;
    var m_calLayer = null;
    var inputNode = null;
    var iconNode = null;
    var valueArr = [];
    var yearStatu = null;

    //-------------事件响应声明---------------s
    var evtFuncs = {
        change: function(ev) {
            var target = ev.target;
            var changeEvent = target.getAttribute("data-change");
            if(className.has(nodeList.week,"hide")){
                if (changeEvent == "lastYear") {
                    yearStatu-=12;
                } else if (changeEvent == "nextYear") {
                    yearStatu+=12;
                }
                custFuncs.getYear(yearStatu);
            }else{
                if (changeEvent == "lastYear") {
                    month--;
                    if (month < 1) {
                        year--;
                        month = 12;
                    }
                } else if (changeEvent == "nextYear") {
                    month++;
                    if (month > 12) {
                        year++;
                        month = 1;
                    }
                }
                date = Math.min(date, custFuncs.getMouthDay(year, month - 1));
                cal.setDate(year, month, date);
                if (inputNode && inputNode.value) {
                    custFuncs.calendarPaint(valueArr);
                    return;
                }
                custFuncs.calendarPaint();
            }            
        },
        selDate: function(ev) {
            var target = ev.target;
            if (className.has(target, "disabled")) return;
            each(dates, function(item) {
                className.has(item, "cur") && className.remove(item, "cur");
            });
            !className.has(target, "cur") && className.add(target, "cur");
            curDate = target.getAttribute("data-curdate").substring(0, 11);

            hour = nodeList.timeNum[0].value;
            minute = nodeList.timeNum[1].value;

            var seletDate = curDate + " " + hour + ":" + minute;
            if (isLayer) {
                if (timeDetail) {
                    inputNode.value = seletDate;
                } else {
                    inputNode.value = curDate;
                }

                that.fire("click", {
                    value: curDate,
                    timeDetail: seletDate,
                    node: inputNode
                });

                m_cal.hide();
            }
            opts["selDate"](curDate, seletDate, inputNode);
        },
        hover: function(ev) {
            var target = ev.target;
            if (target.nodeName == "B") {
                if (className.has(target, "disabled")) return;
                !className.has(target, "hover") && className.add(target, "hover");
            }
        },
        leave: function(ev) {
            var target = ev.target;
            if (target.nodeName == "B") {
                if (className.has(target, "disabled")) return;
                className.has(target, "hover") && className.remove(target, "hover");
            }
        },
        showCalendar: function(ev) {
            var self = this;
            var target = ev.target;
            if (target.nodeName == "INPUT") {
                iconNode = null;
                inputNode = target;
            } else if (target == self) {
                iconNode = null;
                return;
            } else {
                iconNode = target;
                var inNode = self.querySelector("[data-input]");
                inputNode = !inNode ? self.querySelector("input") : inNode;
            }
            if(inputNode){
                opts.showDay = inputNode.getAttribute('data-type') !== '0';
            }
            m_cal.hide();
            custFuncs.resetCalendar();
            var initTime = opts["initValue"] ? new Date(opts["initValue"]) : new Date();
            if(opts["initTime"]&&!opts["initValue"]){
                var initTimeArr = opts["initTime"].split(":");
                if(parseFloat(initTimeArr[0]) < 0||parseFloat(initTimeArr[0]) > 23){
                    initHour = initTime.getHours();
                }else{
                    initHour = parseFloat(initTimeArr[0]);
                } 
                if(parseFloat(initTimeArr[1]) < 0||parseFloat(initTimeArr[1]) > 59){
                    initHour = initTime.getMinutes();
                }else{
                    initMinute = parseFloat(initTimeArr[1]);
                }                
            }else{
                initHour = initTime.getHours();
                initMinute = initTime.getMinutes(); 
            }            

            custFuncs.timePaint();
            m_cal.show();
            custFuncs.setPosition();
            addEvent(document.body, "click", evtFuncs.hideCalendar);
        },
        hideCalendar: function(ev) {
            var target = ev.target;
            if (target == inputNode || target == iconNode || closest(target, "[data-layer]")) {
                return;
            }
            m_cal.hide();
        },
        delInput: function() {
            curDate = '';
            inputNode.value = "";
            isLayer && m_cal.hide();
            that.fire("click", {
                value: '',
                timeDetail: '',
                node: inputNode
            });
        },
        backToday: function() {
            custFuncs.showWeek();
            cal.setDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
            custFuncs.calendarPaint();

            // add: 非浮层显示时需要通知外部时间变更
            curDate = cal.format(format, now);
            hour = nodeList.timeNum[0].value;
            minute = nodeList.timeNum[1].value;

            var seletDate = curDate + " " + hour + ":" + minute;
            
            opts["selDate"](curDate, seletDate, inputNode);

            //inputNode && (inputNode.value = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate());
            //isLayer && m_cal.hide();
        },
        selTime: function(ev) {
            var self = this;
            var index = self.getAttribute("data-time");

            if (className.has(self, "act")) {
                var target = ev.target;
                if (target.tagName == "LI") {
                    if (className.has(target, "disabled")) return;

                    var time = parseInt(target.innerHTML);
                    index == 0 ? (hour = time) : (minute = time);
                    nodeList.timeNum[index].value = time < 10 ? "0" + time : time;

                    if (index == 0) {
                        if ((time == parseInt(initHour)) && (!opts["before"] || !opts["after"])) {
                            nodeList.timeList[1].innerHTML = custFuncs.setTimeList(initMinute, 59, opts["before"], opts["after"]);
                        } else {
                            nodeList.timeList[1].innerHTML = custFuncs.setTimeList(initMinute, 59, true, true);
                        }
                    }
                }
                className.remove(self, "act");
                return;
            }

            custFuncs.removeTimeAct();
            className.add(self, "act");
            nodeList.timeList[index].scrollTop = 28 * ((index == 0 ? hour || initHour : minute || initMinute) - 1);
        },
        hideTime: function(ev) {
            var target = ev.target;

            if (closest(target, "[data-time]")) {
                return;
            }
            custFuncs.removeTimeAct();
        },
        timeKeyUp: function (ev) {
            var n = ev.target;
            n.value= n.value.replace(/[^\d]/g,'');
            if(n.value.length > 2){
                n.value = n.value.substr(0, 2);
            }

            if(n.getAttribute('data-type') === '0'){
                if(n.value > 23){
                    n.value = '23';
                }else if(n.value < 0){
                    n.value = '00';
                }
            }else{
                if(n.value > 59){
                    n.value = '59';
                }
            }

            if(n.value < 0){
                n.value = '00';
            }
        },
        toggleYear:function(){
            if(className.has(nodeList.yearList,"hide")){
                var num = Math.floor(year % 10);
                custFuncs.getYear(year-num); 
                custFuncs.showYear();
                              
            }else{
                custFuncs.showWeek();                 
            }
        },        
        toggleMonth:function(){
            if(className.has(nodeList.monthList,"hide")){
                custFuncs.getMonth();
                custFuncs.showMonth();
            }else{
                custFuncs.showWeek();                 
            }
        },
        getVal:function(e){   
            e = e? e: window.event
            var target = e.srcElement ? e.srcElement:e.target;
            if(target == this) return;           
            if(this.getAttribute("node-name") == "yearBox"){
                nodeList.year.innerHTML = target.innerHTML;                 
                year=parseFloat(target.innerHTML);                            
            }else{
                nodeList.month.innerHTML = target.innerHTML;       
                month=parseFloat(target.innerHTML);                                 
            }
            className.remove(sizzle("[data-mark=m]"),"cur");
            className.add(target,"cur");
            cal.setDate(year, month, date); 
            custFuncs.calendarPaint();
            custFuncs.showWeek();
            hour = nodeList.timeNum[0].value;
            minute = nodeList.timeNum[1].value;
            var seletDate = year + "-" +(month<10?('0'+month):month) + "-" +(date<10?('0'+date):date);
            if(!opts.showDay){
                seletDate = year + "-" +(month<10?('0'+month):month);
            }
            if (isLayer) {
                if (timeDetail) {
                    inputNode.value = seletDate+ " " + hour + ":" + minute;
                } else {
                    inputNode.value = seletDate;
                }
                that.fire("click", {
                    value: seletDate,
                    timeDetail: seletDate+ " " + hour + ":" + minute,
                    node: inputNode
                });
            }
            opts["selDate"](seletDate, seletDate+ " " + hour + ":" + minute, inputNode);
        },        
        /*formatDate:function(){//可输入文本框格式化文本
            var val = this.value,h = null,m = null;
            val = new Date(val.replace(/-/g,"-"));
            if(/Invalid|NaN/.test(val.toString())){
                this.value=opts["initValue"];
                console.log("日期格式错误！");
                return;
            }
            h = val.getHours();
            m = val.getMinutes();
            val = cal.format(format, val);
            cal.setDate(val);
            custFuncs.calendarPaint(val.split('-'));
            if(opts['timeDetail']){
                nodeList.timeNum[0].innerHTML = h;
                nodeList.timeNum[1].innerHTML = m;
                nodeList.timeList[0].innerHTML = custFuncs.setTimeList(h, 23, opts["before"], opts["after"]);
                nodeList.timeList[1].innerHTML = custFuncs.setTimeList(m, 59, opts["before"], opts["after"]);
                this.value = cal.format('%yyyy-%MM-%dd', new Date(val)) + " " + (h < 10 ? "0" + h : h) +":"+ (m < 10 ? "0" + m : m);
            }else{
                this.value = cal.format('%yyyy-%MM-%dd', new Date(val));
            }
        }*/
    };

    //-------------子模块实例化---------------
    var initMod = function() {
        if (isLayer) {
            m_cal = popup(render());
            // 找到所有带有node-name的节点
            m_calLayer = m_cal.getOuter();
            nodeList = parseModule(m_calLayer);
            m_calLayer.setAttribute("data-layer", "layer");
            return;
        }
        node.insertAdjacentHTML('afterbegin', render());
        nodeList = parseModule(node);
        className.add(nodeList.delInput, "hide");
    };

    //-------------绑定事件------------------
    var bindEvents = function() {
        eventProxy(nodeList.change).add("change", "click", evtFuncs.change);
        eventProxy(nodeList.list).add("selDate", "click", evtFuncs.selDate);
        addEvent(nodeList.list, "mouseover", evtFuncs.hover);
        addEvent(nodeList.list, "mouseout", evtFuncs.leave);
        addEvent(nodeList.backToday, "click", evtFuncs.backToday);
        addEvent(nodeList.delInput, "click", evtFuncs.delInput);
        addEvent(nodeList.timeBtn, "click", evtFuncs.selTime);
        addEvent(nodeList.year, "click", evtFuncs.toggleYear);
        addEvent(nodeList.month, "click", evtFuncs.toggleMonth);
        addEvent(nodeList.yearBox, "click", evtFuncs.getVal);
        addEvent(nodeList.monthBox, "click", evtFuncs.getVal);
        addEvent(m_calLayer, "click", evtFuncs.hideTime);
        addEvent(nodeList.timeNum, 'keyup', evtFuncs.timeKeyUp);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        initView: function() {
            if (initValue && node) {
                node.value = initValue.replace(/(\d{4}).(\d{1,2}).(\d{1,2}).(\d{1,2}).(\d{1,2}).*/g, '$1-$2-$3 $4:$5');
            }
            initValue = initValue ? initValue.replace(/(\d{4}).(\d{1,2}).(\d{1,2}).(\d{1,2}).(\d{1,2}).*/g, '$1-$2-$3 $4:$5') : new Date();
            cal.setDate(initValue);
            custFuncs.calendarPaint();
            if (opts["width"]) {
                nodeList.calBody.style.width = opts["width"] + "px";
            }
            custFuncs.addInput(node);
        },
        addInput: function(pNode) {
            if (!isLayer) return;
            each([].concat(pNode), function(item) {
                if (!item) {
                    // console.warn("该节点不存在！");
                    return;
                }

                addEvent(item, "click", evtFuncs.showCalendar);
                // if(!item.getAttribute('readonly')) addEvent(item, "change", evtFuncs.formatDate);
            })
        },
        removeInput: function(inputNode) {
            if (!isLayer) return;

            var inputNodes = [];
            inputNodes = inputNodes.concat(inputNode);
            each(inputNodes, function(item) {
                if (!item) {
                    console.warn("该节点不存在！");
                    return;
                }
                removeEvent(item, "focus", evtFuncs.showCalendar);
            })
        },
        resetCalendar: function(date) {
            var value = date ? date : inputNode.value;
            custFuncs.showWeek();
            if (value) {
                value = value.replace(/(\d{4}).(\d{1,2}).(\d{1,2}).(\d{1,2}).(\d{1,2}).*/g, '$1-$2-$3 $4:$5');
                cal.setDate(value);
                valueArr = value.split("-");
                custFuncs.calendarPaint(valueArr);
            } else {
                if (opts["initValue"]) {
                    cal.setDate(initYear, initMonth, initDate);
                } else {
                    cal.setDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
                }
                custFuncs.calendarPaint();
            }
        },
        getMouthDay: function(year, month){//当月天数
            var md = [31,28,31,30,31,30,31,31,30,31,30,31];
            if (((0 === (year % 4)) && ((0 !== (year%100)) || (0 === (year%400)))) && month === 1){
                return 29;
            } else {
                return md[month];
            }
        },
        getCurDate: function() {
            if (!curDate) {
                console.warn("请先选择日期！");
                return;
            }
            return curDate;
        },
        timePaint: function() {
            if (!timeDetail) return;
            className.has(nodeList.timeBtns, "hide") && className.remove(nodeList.timeBtns, "hide");

            custFuncs.removeTimeAct();
            var curHour = hour != null ? parseInt(hour) : initHour;
            var curMinute = minute != null ? parseInt(minute) : initMinute;
            nodeList.timeNum[0].value = curHour < 10 ? "0" + curHour : curHour;
            nodeList.timeNum[1].value = curMinute < 10 ? "0" + curMinute : curMinute;

            nodeList.timeList[0].innerHTML = custFuncs.setTimeList(initHour, 23, opts["before"], opts["after"]);
            nodeList.timeList[1].innerHTML = curHour == initHour ?
                custFuncs.setTimeList(curMinute, 59, opts["before"], opts["after"]) :
                nodeList.timeList[1].innerHTML = custFuncs.setTimeList(curMinute, 59, true, true);
        },
        setTimeList: function(curTime, endTime, before, after) {
            if (!(initYear == year && initMonth == month && initDate == date)) {
                before = true;
                after = true;
            }

            var list = "";
            var i = -1;
            while (i++ < endTime) {
                if (i < curTime) {
                    list += "<li" + (!before ? " class='disabled'" : "") + ">" + i + "</li>";
                } else {
                    list += "<li" + (!after ? " class='disabled'" : "") + ">" + i + "</li>";
                }
            }
            return list;
        },
        calendarPaint: function(curArr) {
            var current = cal.getDate();
            var dateList = cal.getView();
            year = current.getFullYear();
            month = current.getMonth() + 1;
            date = current.getDate();

            var html = "";
            each(dateList, function(item, index) {
                var classNames = "";
                var sun = index % 7 == 0;
                var sat = index % 7 == 6;
                var cur = "";
                if (item.month == month) {
                    if (sun || sat) {
                        classNames = "dayoff";
                    }
                } else {
                    classNames = "wrong";
                    if (sun || sat) {
                        classNames += " dayoff";
                    }
                }

                var valueArr = initValue.toString().split("-");
                if (valueArr.length == 1) {
                    initYear = initValue.getFullYear();
                    initMonth = initValue.getMonth() + 1;
                    initDate = initValue.getDate();
                } else {
                    initYear = parseInt(valueArr[0]);
                    initMonth = parseInt(valueArr[1]);
                    initDate = parseInt(valueArr[2]);
                }
                var now = new Date(),Y = now.getFullYear(),M = now.getMonth() + 1,D = now.getDate();

                !curArr && (curArr = [initYear, initMonth, initDate]);
                if (item.year == parseInt(curArr[0]) && item.month == parseInt(curArr[1]) && item.date == parseInt(curArr[2])) {
                    classNames += " cur";
                }

                if (!opts["before"]) {
                    if (item.year < Y ||
                        (item.year == Y && item.month < M) ||
                        (item.year == Y && item.month == M && item.date < D)) {
                        classNames += " disabled";
                    }
                }

                if (!opts["after"]) {
                    if (item.year > Y ||
                        (item.year == Y && item.month > M) ||
                        (item.year == Y && item.month == M && item.date > D)) {
                        classNames += " disabled";
                    }
                }

                if (item.date == now.getDate() && item.month == now.getMonth() + 1 && item.year == now.getFullYear()) cur = "<i></i>";
                if (sun) html += '<div>';
                html += '<p><b class="' + classNames + '" data-action="selDate" data-curdate="' + cal.format(format, new Date(item.ins)) + '">' + item.date + cur + '</b></p>';
                if (sat) html += '</div>';
            });

            nodeList.list.innerHTML = html;
            nodeList.month.innerHTML = monthList[month - 1] + "月";
            nodeList.year.innerHTML = year+"年";
            dates = sizzle("[data-curdate]", nodeList.list);
        },
        setPosition: function() {
            var nodeWidth = inputNode.offsetWidth;
            var nodeHeight = inputNode.offsetHeight;

            if (!opts["width"]) {
                nodeWidth > 250 && (nodeList.calBody.style.width = nodeWidth - 2 + "px");
            }

            var scroll = scrollPos();
            var boundingClientRect = inputNode.getBoundingClientRect();
            var calTop = boundingClientRect.top + scroll.top; //日历在页面中的top
            var calLeft = boundingClientRect.left + scroll.left;
            //向下展开时，日历的下边框距离屏幕顶部的距离
            var calendarMaxBottom = calTop + nodeList.calBody.offsetHeight + nodeHeight;
            var barSize = scrollBarSize();
            var popupY = 0;
            // 默认向下展开；向下展开位置不够时，向上展开(前提:上方有足够位置)；
            if (calendarMaxBottom >= (scroll.top + document.body.scrollHeight - barSize.h) && calTop > nodeList.calBody.offsetHeight) {
                //距离屏幕顶端距离 - 高度
                popupY = calTop - nodeList.calBody.offsetHeight;
            } else {
                popupY = calTop + nodeHeight;
            }

            m_calLayer.style.top = popupY + "px";
            m_calLayer.style.left = calLeft + "px";
        },
        hideCalendar: function() {
            if (isLayer) {
                m_cal.hide();                
                return;
            }
            className.add(pNode, "hide");
        },
        removeTimeAct: function() {
            each(nodeList.timeBtn, function(item) {
                className.has(item, "act") && className.remove(item, "act");
            });
        },
        getMonth:function(){        
            var html="",className="",cur="";            
            monthList.forEach(function(item,i) { 
                className="";            
                if(item==month){
                    className=" cur";
                    cur='<i></i>';
                }else{
                    className="";
                    cur="";
                }
                html+="<p class='"+className+"' data-mark='m'>"+item+"月"+cur+"</p>";
            });
            nodeList.monthBox.innerHTML=html;            
        },
        getYear:function(n){
            var num =null,arr = [],html="",i=n,className="",cur="";          
            yearStatu=n;
            while (arr.length < 12) {
                className=""
                if(year==i){
                    className=" cur";
                    cur='<i></i>';
                }else{
                    className="";
                    cur="";
                }
                html+="<p class='"+className+"' data-mark='m'>"+i+"年"+cur+"</p>"; 
                i++;
                arr.push(i);
            }            
            nodeList.yearBox.innerHTML=html;
        },
        hideYear:function(){
            className.add(nodeList.yearList,"hide"); 
        },
        hideMonth:function(){
            className.add(nodeList.monthList,"hide");
        },
        showMonth:function(){
            className.add(nodeList.week,"hide");
            className.remove(nodeList.monthList,"hide");
            className.add(nodeList.yearList,"hide");
            className.add(nodeList.changeNav,"hide");
        },
        showYear:function(){
            className.add(nodeList.week,"hide");
            className.add(nodeList.monthList,"hide");
            className.remove(nodeList.yearList,"hide");
            className.remove(nodeList.changeNav,"hide");
        },
        showWeek:function(){
            if(opts.showDay){
                className.remove(nodeList.week,"hide");
                className.add(nodeList.monthList,"hide");
                className.add(nodeList.yearList,"hide");
                className.remove(nodeList.changeNav,"hide");
            }else{
                custFuncs.getMonth();
                custFuncs.showMonth();
            }
        }
    };

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
        custFuncs.initView();
    };

    init();

    //---------------暴露API----------------
    that.add = custFuncs.addInput;
    that.remove = custFuncs.removeInput;
    that.hide = custFuncs.hideCalendar;
    that.showCalendar = evtFuncs.showCalendar;
    return that;
};