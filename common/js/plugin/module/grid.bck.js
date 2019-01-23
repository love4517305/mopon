/**
 * 表格
 */

module.exports = function (node, opts) {
	//----------------require--------------

	var base = require("lib/comp/base"); // 基础对象
	var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
	require("plugin/scss/font.scss");
    // require("plugin/scss/grid.scss");
	var addEvent = require('lib/evt/add');
	var removeEvent = require('lib/evt/remove');
	var eventProxy = require("lib/evt/proxy");
	var each = require("lib/util/each");
	var merge = require("lib/json/merge");
	var setStyle = require("lib/dom/setStyle");
	var preventDefault = require("lib/evt/preventDefault");
	var stopPropagation = require("lib/evt/stopPropagation");
	var getPosition = require("lib/dom/getPosition");
	var opra = require("lib/dom/node");
	var sNull = require("../util/sNull");
	var className = require("lib/dom/className");
	var getType = require("lib/util/getType");
	var gridRender = require("plugin/tmpl/grid.ejs");
	var gridContRender = require("plugin/tmpl/gridCont.ejs");
	var closest = require("lib/dom/closest");
	var formatDate = require("../util/formatDate");
	var sizzle = require("lib/dom/sizzle");
	var isNode = require("lib/dom/isNode");
	var animate = require("plugin/util/animate");
	var calendar = require("plugin/module/calendar");
	var dataset = require("lib/dom/dataset");
	var filter = require("plugin/util/filterData");
	var objectSet = require("plugin/util/objectSet");

	//-----------声明模块全局变量-------------
	var nodeList = null; // 存储所有关键节点
	var that = base();
    var data = null,
        p_timer = null,
        m_calendar = null,
        config = {
    		status: {
                initStatus: true,
                firstLoad: true,
                group: false,
                down: false,
                scroll: false
			},
			cache: {
    			data: {},
				sort: {},
				page: {}
			},
			groupName: null
        }, defaults = {
            data: [],
            columns: [],
            order: false, //序号
            selectType: "checkbox", //选择框类型，单选radio和多选checkbox
            selectStatus: "show",//显示show|隐藏hide
            width: "100%",
            cache: null, //添加选中的缓存{field: "唯一属性名称"}
            totalPages: 1, //总页数
            pageSize: 50, //每页显示几条
            curPage: 1, //当前页
            totalRows: 0, //总条数
            disabled: false, //禁止编辑
            show: true, //显示分页
            clickRows: true, //响应tr点击事件
            resize: true, //自动缩放
            tooltip: false, //提示信息
            title: true, //显示title信
            autoCal: true,//默认显示自动计算
            allowEmptyText: "--请选择--",
            allowEmpty: null,//true|["name"]是否允许下拉框第一行为空
            dataGroup: {
                name: "group"
            }, //数据分组
            titleHeight: 40, //表头高度
            rowHeight: 40, //每行高度
            height: null, //默认
            minHeight: null, //最小高度
            maxHeight: null, //最大高度
            dateConfig: null, //日期配置
            pageList: [10, 20, 30, 40, 50] //每页数列表
        };
    opts = merge(defaults, opts || {}, {groupInfo: {}, map: {}});

	//-------------事件响应声明---------------
	var evtFuncs = {
		scroll: function (e) {
			if (config.status.initStatus) return;
			var x = nodeList.gridCont.scrollLeft;
			setStyle(nodeList.gridHeader, {
				marginLeft: -x + "px"
			});
			nodeList.groupTable && setStyle(nodeList.groupTable, {
				marginLeft: -x + "px"
			});
			if(!className.has(nodeList.gridRightScroll, "hide")){
				var y = nodeList.gridCont.scrollTop;
				var h = nodeList.gridCont.offsetHeight;
				var sh = nodeList.gridCont.scrollHeight;
				var toolHeight = nodeList.rightScrollTool.offsetHeight;
				nodeList.rightScrollTool.style.top = custFuncs.unit(Math.min(y * h / sh, h - toolHeight - 34));
			}
		},
		mouseDown: function (evt) {
			var cursorX = evt.event.clientX;
			var parent = evt.target.parentNode;
			var index = dataset.get(parent, "index");
			preventDefault(evt.event);
			var next = opra.next(parent);
			parent.style.cursor = "col-resize";
			if (next) next.style.cursor = "col-resize";
			var bsHide = className.has(nodeList.gridBottomScroll, "hide");
			if(bsHide) custFuncs.setGridCont(false);
            var x = 0;
			function _onmousemove(e){
				e = e || window.event;
				var moveX = e.clientX;
				x = moveX - cursorX;
				custFuncs.changeWidth(x, index);
				preventDefault(e);
			}
			function _onmouseup(){
				removeEvent(document, "mousemove", _onmousemove);
				removeEvent(document, "mouseup", _onmouseup);
				var item = opts.columns[index];
				x = Math.max(item.minWidth - item.width, x);
				custFuncs.movePos(x, index);
				config.status.firstLoad = false;
				parent.style.cursor = "default";
				if (next) next.style.cursor = "default";
				if(bsHide) custFuncs.setGridCont(true);
				custFuncs.loadScroll();
			}
			addEvent(document, "mousemove", _onmousemove);
			addEvent(document, "mouseup", _onmouseup);
		},
		scrollRightTool: function(evt){
			var cursorY = evt.clientY;
			var cTop = parseFloat(nodeList.rightScrollTool.style.top || 0.1);
			var h = nodeList.gridCont.offsetHeight;
			var sh = nodeList.gridCont.scrollHeight;
			var toolHeight = nodeList.rightScrollTool.offsetHeight;
			var init = config.status.initStatus;
			config.status.initStatus = true;
			function _onmousemove(evt){
				var moveY = evt.clientY;
				var y = moveY - cursorY + cTop;
				var top = Math.max(0, Math.min(h - toolHeight, y));
				var sTop = Math.max(0, Math.min(h - toolHeight - 34, y));
				nodeList.rightScrollTool.style.top = custFuncs.unit(sTop);
				nodeList.gridCont.scrollTop = top * sh / h;
				preventDefault(evt);
			}
			function _onmouseup(){
				removeEvent(document, "mousemove", _onmousemove);
				removeEvent(document, "mouseup", _onmouseup);
				config.status.initStatus = init;
			}
			addEvent(document, "mousemove", _onmousemove);
			addEvent(document, "mouseup", _onmouseup);
		},
		scrollBottomTool: function(evt){
			var cursorX = evt.clientX;
			var cLeft = parseFloat(nodeList.bottomScrollTool.style.left || 0.1);
			var w = nodeList.gridCont.offsetWidth;
			var sw = nodeList.gridCont.scrollWidth;
			var toolWidth = nodeList.bottomScrollTool.offsetWidth;
			function _onmousemove(evt){
				var moveX = evt.clientX;
				var x = moveX - cursorX + cLeft;
				var left = Math.max(0, Math.min(w - toolWidth, x));
				var sLeft = Math.max(0, Math.min(w - toolWidth - 36, x));
				nodeList.bottomScrollTool.style.left = custFuncs.unit(sLeft);
				nodeList.gridCont.scrollLeft = left * sw / w;
				preventDefault(evt);
			}
			function _onmouseup(){
				removeEvent(document, "mousemove", _onmousemove);
				removeEvent(document, "mouseup", _onmouseup);
			}
			addEvent(document, "mousemove", _onmousemove);
			addEvent(document, "mouseup", _onmouseup);
		},
		radio: function (evt) {
			var self = evt.target;
			var name = dataset.get(self, "name");
			if(name){
				var index = dataset.get(self, "index");
				if(getType(index) === "string"){
					var groupIndex = dataset.get(self, "group");
					custFuncs.changeDataValue(index, groupIndex, name, self.value);
					opts.data[index].__update__ = true;
					that.fire(name + "radio", {
						data: custFuncs.clone(opts.data[index]),
						node: self
					});
				}
			}else{
				custFuncs.radio(self);
			}
		},
		checkbox: function (evt) {
			var self = evt.target;
			var name = dataset.get(self, "name");
			if(name){
				var index = dataset.get(self, "index");
				if(getType(index) === "string"){
					var result = [];
					var node = closest(self, ".text");
					if(node){
						each(sizzle("input", node), function(item){
							if(item.checked) result.push(item.value);
						});
					}
					var groupIndex = dataset.get(self, "group");
					custFuncs.changeDataValue(index, groupIndex, name, result.join(","));
					opts.data[index].__update__ = true;
					that.fire(name + "checkbox", {
						data: custFuncs.clone(opts.data[index]),
						node: self
					});
				}
			}else{
				custFuncs.checkbox(self);
			}
		},
        calculateWidth: function(ev){
            var self = ev.target;
            var type = dataset.get(self, "type");
            var name = dataset.get(self, "field");
            var index = dataset.get(self, "index");
            if(!config.cache.data.back){
                custFuncs.changeAutoCalStatus(true, true);
            }
            if(type === "start"){
            	opts.fieldMap[name].autoType = "stop";
                opts.fieldMap[name].title = "关闭自动计算";
                config.cache.data.back.list.push(name);
                custFuncs.autoWidth(name, index);
            }else if(type === "stop"){
            	config.cache.data.back.bool = true;
                delete opts.fieldMap[name].autoType;
                delete opts.fieldMap[name].title;
                each(config.cache.data.back.list, function(val, index){
                    if(val === name){
                        config.cache.data.back.list.splice(index, 1);
                        return false;
                    }
                });
                if(config.cache.data.back.list.length === 0){
                    custFuncs.changeAutoCalStatus(false);
                }else{
                    config.cache.data.width -= config.cache.data.columns[index].width;
                    config.cache.data.width += config.cache.data.back.columns[index].initWidth;
                    config.cache.data.columns[index].width = config.cache.data.back.columns[index].initWidth;
				}
                custFuncs.initView();
            }
        },
        toggleWidth: function(){
			if(config.cache.data.back){
               	custFuncs.changeAutoCalStatus(false);
                custFuncs.initView();
			}else{
                custFuncs.changeAutoCalStatus(true, false);
                each(config.cache.data.columns, function(item){
                	config.cache.data.back.list.push(item.name);
                    opts.fieldMap[item.name].autoType = "stop";
                    opts.fieldMap[item.name].title = "关闭自动计算";
				});
				custFuncs.autoWidth();
			}
		},
		selectPageSize: function (e) {
			var elem = e.target;
			var val = elem.innerHTML;
			var parent = elem.parentNode;
			var id = dataset.get(parent, "forId");
			var type = dataset.get(elem, "type");
			var curNode = null;
			if (id) {
				curNode = document.getElementById(id);
				parent.removeAttribute("id");
				curNode.removeAttribute("id");
			} else {
				curNode = opra.prev(parent);
			}
			config.cache.page.prevValue = parseInt(curNode.value);
			config.cache.page.node = curNode;
			curNode.value = val;
			className.add(parent, "hide");
			if (type === "grid") {
				node.style.overflow = "hidden";
				var key = dataset.get(elem, "key");
				dataset.set(curNode, "key", key);
				var index = dataset.get(curNode, "index");
				var name = dataset.get(curNode, "name");
				var groupIndex = dataset.get(elem, "group");
				custFuncs.changeDataValue(index, groupIndex, name, key);
				opts.data[index].__update__ = true;
				that.fire(name + "select", {
					data: custFuncs.clone(opts.data[index]),
					node: elem,
					inputNode: curNode
				});
			} else if (type === "page") {
				opts.pageSize = parseInt(val);
				config.cache.page.curValue = opts.pageSize;
				custFuncs.updatePage(opts.totalRows);
				that.fire("page", {
					pageSize: opts.pageSize,
					curPage: opts.curPage
				});
				custFuncs.setPage();
			} else if (type === "hours") {
				stopPropagation(e.event);
				nodeList.timeHours.value = val;
			} else if (type === "minutes") {
				stopPropagation(e.event);
				nodeList.timeMinutes.value = val;
			}
			if (type === "hours" || type === "minutes") {
				var forId = dataset.get(nodeList.gridTime, "forId");
				var inputNode = document.getElementById(forId);
				inputNode.value = nodeList.timeHours.value + ":" + nodeList.timeMinutes.value;
			}
		},
		showTime: function (e) {
			stopPropagation(e.event);
			var elem = e.target;
			var pos = getPosition(elem);
			var offset = getPosition(node);
			node.style.overflow = "inherit";
			setStyle(nodeList.gridTime, {
				top: custFuncs.unit(pos.top + custFuncs.media(22, 28) - offset.top),
				left: custFuncs.unit(pos.left - offset.left - 1)
			});
			var id = new Date().getTime() + "_" + Math.round(Math.random() * 1000);
			dataset.set(nodeList.gridTime, "forId", id);
			elem.id = id;
			className.remove(nodeList.gridTime, "hide");
			if (/^(\d{1,2})\:(\d{1,2})$/.test(elem.value)) {
				var v1 = parseInt(RegExp.$1);
				var v2 = parseInt(RegExp.$2);
				nodeList.timeHours.value = v1 < 10 ? "0" + v1 : v1;
				nodeList.timeMinutes.value = v2 < 10 ? "0" + v2 : v2;
			}
		},
		showSelect: function (e) {
			stopPropagation(e.event);
			var elem = e.target;
			var selectNode = opra.next(elem);
			var type = dataset.get(elem, "type");
			if (type !== "other") {
				var pos = getPosition(elem);
				var pagePos = getPosition(nodeList.gridPage);
				var gridCont = getPosition(nodeList.gridCont);
				var h = parseInt(selectNode.style.height);
				var oh = nodeList.gridCont.offsetHeight;
				var formTop = pos.top - gridCont.top < h;
				var fromBottom = pagePos.top - pos.top < h + 31;
				if (oh < h + 31 || (formTop && fromBottom)) {
					nodeList.gridSelect.innerHTML = selectNode.innerHTML;
					var offset = getPosition(node);
					setStyle(nodeList.gridSelect, {
						top: custFuncs.unit(pos.top + custFuncs.media(22, 29) - offset.top),
						left: custFuncs.unit(pos.left - offset.left - 1),
						width: custFuncs.unit(elem.offsetWidth)
					});
					node.style.overflow = "inherit";
					className.add(selectNode, "hide");
					className.remove(nodeList.gridSelect, "hide");
					var id = new Date().getTime() + "_" + Math.round(Math.random() * 1000);
					dataset.set(nodeList.gridSelect, "forId", id);
					elem.id = id;
					return;
				}
				if (fromBottom) {
					selectNode.style.top = -parseFloat(dataset.get(selectNode, "offset")) + "px";
				} else {
					selectNode.style.top = custFuncs.media("23px", "31px");
				}
			}
			className.remove(selectNode, "hide");
		},
		tooltip: function (e) {
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			var name = elem.nodeName.toLowerCase();
			var cls = elem.className;
			if ((name === "td" && cls === "") || (name === "div" && cls === "text")) {
				if (name === "div") elem = elem.parentNode;
				var cols = dataset.get(elem, "tooltips");
				var index = dataset.get(elem, "index");
				if (cols === null) {
					className.add(nodeList.gridHover, "hide");
					return;
				}
				clearTimeout(p_timer);
				p_timer = setTimeout(function () {
					var pos = getPosition(node);
					var x = e.pageX || e.clientX + document.body.scrollTop - document.body.clientTop;
					var y = e.pageY || e.clientY + document.body.scrollLeft - document.body.clientLeft;
					x = x - pos.left;
					y = y - pos.top;
					var code = '';
					each(opts.columns[cols].tooltips, function (item) {
						var value = opts.data[index][item.name];
						if (item.dataType === "date") {
							value = formatDate(value, item.format);
						} else if (getType(item.render) === "function") {
							value = item.render(value);
						}
						code += '<li class="item">' + item.display + '：' + value + '</li>';
					});
					nodeList.hoverItems.innerHTML = code;
					className.remove(nodeList.gridHover, "hide");
					var top = parseInt(nodeList.gridHover.style.top || 0);
					var left = parseInt(nodeList.gridHover.style.left || 0);
					var realPos = custFuncs.getPos(nodeList.gridHover, x, y);
					animate(top === 0 && left === 0 ? 0 : 240, function (p) {
						nodeList.gridHover.style.top = top + (realPos.top - top) * p + "px";
						nodeList.gridHover.style.left = left + (realPos.left - left) * p + "px";
					}).start(true);
				}, 35);
			} else {
				className.add(nodeList.gridHover, "hide");
			}
		},
		showTips: function (e) {
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			if(className.has(elem, "hover-tips")) elem = elem.parentNode;
			var tips = dataset.get(elem, "tips");
			if (tips) {
				var pos = getPosition(node);
				var curPos = getPosition(elem);
				var x = curPos.left - pos.left + 20;
				var y = curPos.top - pos.top + elem.parentNode.offsetHeight;
				var real = opts.parent_width - curPos.left;
				nodeList.gridTips.innerHTML = tips;
				className.remove(nodeList.gridTips, "hide");
				var tipsWidth = nodeList.gridTips.offsetWidth;
				if (real < 220) {
					className.add(nodeList.gridTips, "right");
					setStyle(nodeList.gridTips, {
						left: custFuncs.unit(x - tipsWidth - 15),
						top: custFuncs.unit(y)
					});
				} else {
					className.remove(nodeList.gridTips, "right");
					setStyle(nodeList.gridTips, {
						left: custFuncs.unit(x),
						top: custFuncs.unit(y)
					});
				}
			} else {
				if (!className.has(nodeList.gridTips, "hide")) {
					className.add(nodeList.gridTips, "hide");
				}
			}
		},
		closeTips: function (e) {
            var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			if (!className.has(nodeList.gridTips, "hide")) {
				className.add(nodeList.gridTips, "hide");
			}
		},
		respondTable: function (e) {
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			if (nodeList.gridCont === elem) return;
			var node = closest(elem, "tr");
			if (!node) return;
			var dataEvent = dataset.get(elem, "event");
			var index = dataset.get(node, "index");
			if (dataEvent && node) {
				var data = dataset.get(elem, "query");
				try {
					if (getType(data) === "string") {
						data = new Function("return " + data)();
					} else {
						data = {};
					}
				} catch (e) {
					data = {}
				}
				elem.blur();
				if(/^([\s\S]+?)\%(\d+)\%(\d+)\%(\d+)\%$/.test(dataEvent)){
					var event = RegExp.$1;
					var sub = parseInt(RegExp.$2);
					var but = parseInt(RegExp.$3);
					var col = parseInt(RegExp.$4);
					var buts = opts.columns[col].buts[but];
					var cache_buts = config.cache.data.columns[col].buts[but];
					var arr = buts.text;
					var curBut = sub;
					if(sub >= arr.length - 1){
						sub = 0;
					}else sub++;
					if(getType(buts.index) === "array"){
						buts.index[index] = sub;
						cache_buts.index[index] = sub;
					}else{
						buts.index = [];
						cache_buts.index = [];
						var len = opts.data.length;
						for(var i = 0;i < len; i++){
							buts.index[i] = 0;
							cache_buts.index[i] = 0;
						}
						buts.index[index] = sub;
						cache_buts.index[index] = sub;
					}
					that.fire(event, {
						index: curBut,
						data: custFuncs.clone(opts.data[index]),
						extraData: data,
						node: elem
					});
					elem.innerHTML = arr[sub];
					elem.title = arr[sub];
				}else{
					that.fire(dataEvent, {
						data: custFuncs.clone(opts.data[index]),
						extraData: data,
						node: elem
					});
				}

			} else if (node) {
				if (className.has(elem, "_stopPropagation")) return;
				if (opts.selectType === "checkbox") {
					var checkbox = nodeList.checkbox[index];
					if (elem !== checkbox && elem.parentNode.className !== "checkbox") {
						custFuncs.checkbox(checkbox, !checkbox.checked);
					}
				} else if (opts.selectType === "radio") {
					var radio = nodeList.checkbox[index];
					if (!radio.checked && elem !== radio && elem.parentNode.className !== "radio") {
						custFuncs.radio(radio, true);
					}
				}

				that.fire("clickRows", {
					type: "tr",
					data: custFuncs.clone(opts.data[index]),
					node: node
				});
			}
		},
		pageTurn: function (e) {
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			if (elem.nodeName.toLowerCase() === "i") elem = elem.parentNode;
			if (className.has(elem, "gray")) return;
			var v = nodeList.page.value;
			var dataValue = dataset.get(elem, "value");
			if (dataValue) v = dataValue;
			config.cache.page.prevValue = opts.curPage;
			config.cache.page.curValue = parseInt(v);
			config.cache.page.node = null;
			opts.curPage = parseInt(v);
			that.fire("page", {
				pageSize: opts.pageSize,
				curPage: v
			});
			custFuncs.setPage();
		},
		formatNumber: function (e) {
			var elem = e.target;
			var v = elem.value;
			var d = dataset.get(elem, "value");
			var lastValue = dataset.get(elem, "lastValue");
			//if (v === lastValue) return;
			if (e.data.name === "page") d = opts.curPage;
			var type = e.data.type;
			var newStr = function (m1, m2, type) {
				var arr = [];
				var bool = true;
				each(m1, function (item, index) {
					if (type === "double" && item === "." && bool && index > 0) {
						arr.push(item);
						bool = false;
					} else if (item !== ".") {
						arr.push(item);
					}
				});
				return (m2 === null ? "" : "-") + arr.join("");
			};

			if (!/^(-?\d+)\.?\d*$/.test(v) && (type === "number" || type === "double")) {
				var m1 = v.match(/\d+|\./g);
				var m2 = v.match(/-/);
				elem.value = m1 === null ? (d === "" ? 0 : d) : newStr(m1, m2, type);
			}

			if (type === "number" || type === "double") {
				var reg =/^(-?)([0]+)(\d+\.?\d*)$/;
				var value = elem.value;
				if(reg.test(value)){
					elem.value = RegExp.$1 + RegExp.$3;
				}
			}

            dataset.set(elem, "lastValue", elem.value);

			if (e.data.name === "page") {
				elem.value = Math.min(opts.totalPages, Math.max(1, elem.value));
			} else {
				var index = dataset.get(elem, "index");
				var name = dataset.get(elem, "name");
				if(getType(index) === "string"){
					var groupIndex = dataset.get(elem, "group");
					custFuncs.changeDataValue(index, groupIndex, name, elem.value);
					opts.data[index].__update__ = true;
					that.fire(name + "keyup", {
						data: custFuncs.clone(opts.data[index]),
						node: elem
					});
				}else{
					that.fire(name + "keyup", {
						node: elem,
						val: elem.value
					});
				}

			}
		},
		sortOrder: function (e) { //升序||降序
			if (opts.data.length === 0) return;
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			var type = parseInt(dataset.get(elem, "type"));
			var index = dataset.get(elem, "index");
			var name = opts.columns[index].type === "order" ? "__order__" : dataset.get(elem, "name");
			var bool = true, beforeNode = null;
			switch (type) {
				case 1:
					if(className.has(elem, "checked")){
						bool = 0;
                        delete opts.fieldMap[name].sort;
                        delete opts.fieldMap[name].sort_id;
                        className.remove(elem, "checked");
					}else{
                        bool = true;
                        className.add(elem, "checked");
                        elem.id = "GRID_ID_" + base.getUniqueId();
                        opts.fieldMap[name].sort = "asc";
                        opts.fieldMap[name].sort_id = elem.id;
                        if(config.cache.sort.name){
                        	beforeNode = document.getElementById(config.cache.sort.id);
                        	if(beforeNode){
                                className.remove(beforeNode, "checked");
							}
                            delete opts.fieldMap[config.cache.sort.name].sort;
                            delete opts.fieldMap[config.cache.sort.name].sort_id;
						}
					}
					break;
				case -1:
                    if(className.has(elem, "checked")){
                        bool = 0;
                        delete opts.fieldMap[name].sort;
                        className.remove(elem, "checked");
                    }else{
                        bool = false;
                        className.add(elem, "checked");
                        elem.id = "GRID_ID_" + base.getUniqueId();
                        opts.fieldMap[name].sort = "desc";
                        opts.fieldMap[name].sort_id = elem.id;
                        if(config.cache.sort.name){
                            beforeNode = document.getElementById(config.cache.sort.id);
                            if(beforeNode){
                                className.remove(beforeNode, "checked");
                            }
                            delete opts.fieldMap[config.cache.sort.name].sort;
                            delete opts.fieldMap[config.cache.sort.name].sort_id;
                        }
                    }
					break;
			}
            if(config.cache.sort.name){
                beforeNode = document.getElementById(config.cache.sort.id);
                if(beforeNode){
                    className.remove(opra.prev(beforeNode.parentNode), "bold");
                    beforeNode.removeAttribute("id");
				}
            }
			if (bool === 0) {
				config.cache.sort = {};
				custFuncs.addRows(custFuncs.getOriginalData(opts.data), false);
			} else {
                className.add(opra.prev(elem.parentNode), "bold");
				config.cache.sort = {name: name, bool: bool, id: elem.id, index: index};
				custFuncs.addRows(opts.data, false);
			}
		},
		resize: function () {
			if(node.offsetWidth === 0) return;
			var h = document.body.offsetHeight;
			var w = document.body.offsetWidth;
			if(getType(opts.resize) === "object"){
				if(h === opts.resize.h && w === opts.resize.w){
					return;
				}
			}
			opts.resize = {h: h, w: w};
			custFuncs.initView();
		},
		gridContDown: function(e){
			if(e.buttons === 2){
				config.status.down = true;
				var _contextMenu = function(e){
					config.status.scroll && preventDefault(e);
				};
				var _mouseUp = function(){
					config.status.down = false;
					removeEvent(nodeList.gridCont, "mouseup", _mouseUp);
					setTimeout(function(){
						config.status.scroll = false;
						removeEvent(nodeList.gridCont, "contextmenu", _contextMenu);
					}, 0);
				};
				addEvent(nodeList.gridCont, "contextmenu", _contextMenu);
				addEvent(nodeList.gridCont, "mouseup", _mouseUp);
			}
		},
		mouseOver: function (e) {
			if (!config.status.group) return;
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			if (!elem) return;
			if (elem.nodeName.toLowerCase() !== "tr") {
				elem = closest(elem, "tr");
			}
			if (!elem) return;
			var nodeName = elem.getAttribute("node-name");
			if (nodeName) {
				className.add(nodeList[nodeName], "hover");
			}
		},
		mouseOut: function (e) {
			if (!config.status.group) return;
			var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
			if (!elem) return;
			if (elem.nodeName.toLowerCase() !== "tr") {
				elem = closest(elem, "tr");
			}
			if (!elem) return;
			var nodeName = elem.getAttribute("node-name");
			if (nodeName) {
				className.remove(nodeList[nodeName], "hover");
			}
		},
		mouseScroll: function(evt){
			(config.status.scroll || config.status.down) && preventDefault(evt);
			if(evt.wheelDelta){
				custFuncs.slideHorizontalScroll(parseInt(evt.wheelDelta) < 0 ? 50 : -50);
			}else if(evt.detail){//Firefox
				custFuncs.slideHorizontalScroll(parseInt(evt.detail) < 0 ? -50 : 50);
			}
		},
		closeWin: function (e) {
			if (!className.has(nodeList.gridSelect, "hide")) {
				className.add(nodeList.gridSelect, "hide");
				node.style.overflow = "hidden";
			}
			if (!className.has(nodeList.gridTime, "hide")) {
				var elem = e.target || e.relatedTarget || e.srcElement || e.currentTarget;
				if (elem === nodeList.gridTime || elem.parentNode === nodeList.gridTime) return;
				className.add(nodeList.gridTime, "hide");
				custFuncs.clearId(nodeList.gridTime, elem);
				node.style.overflow = "hidden";
			}
		}
	}

	//-------------子模块实例化---------------
	var initMod = function () {
		m_calendar = calendar(null, opts.dateConfig || {});
	}

	//-------------绑定事件------------------
	var bindEvents = function () {
		var proxy = eventProxy(node);
		custFuncs.unbindProxy(proxy);
		proxy.add("move", "mousedown", evtFuncs.mouseDown);
		proxy.add("checkbox", "click", evtFuncs.checkbox);
		proxy.add("radio", "click", evtFuncs.radio);
		proxy.add("number", "keyup", evtFuncs.formatNumber);
		proxy.add("showSelect", "click", evtFuncs.showSelect);
		proxy.add("select", "click", evtFuncs.selectPageSize);
		proxy.add("calendar", "click", m_calendar.showCalendar);
		proxy.add("time", "click", evtFuncs.showTime);
        proxy.add("calculate", "click", evtFuncs.calculateWidth);
		addEvent(document.body, "click", evtFuncs.closeWin);
		custFuncs.bindEvents();
	}

	//-------------自定义函数----------------
	var custFuncs = {
		unbindProxy: function (proxy) {
			try {
				proxy.remove("move", "mousedown", evtFuncs.mouseDown);
				proxy.remove("checkbox", "click", evtFuncs.checkbox);
				proxy.remove("radio", "click", evtFuncs.radio);
				proxy.remove("number", "keyup", evtFuncs.formatNumber);
				proxy.remove("showSelect", "click", evtFuncs.showSelect);
				proxy.remove("select", "click", evtFuncs.selectPageSize);
				proxy.remove("calendar", "click", m_calendar.showCalendar);
				proxy.remove("time", "click", evtFuncs.showTime);
                proxy.remove("calculate", "click", evtFuncs.calculateWidth);
                removeEvent(document.body, "click", evtFuncs.closeWin);
			} catch (e) {
				console.log("未绑定");
			}
		},
		unbindEvents: function () {
			removeEvent(nodeList.btn, "click", evtFuncs.pageTurn);
			removeEvent(nodeList.first, "click", evtFuncs.pageTurn);
			removeEvent(nodeList.prev, "click", evtFuncs.pageTurn);
			removeEvent(nodeList.next, "click", evtFuncs.pageTurn);
			removeEvent(nodeList.last, "click", evtFuncs.pageTurn);
			removeEvent(nodeList.gridCont, "mousedown", evtFuncs.gridContDown);
			removeEvent(nodeList.gridCont, "mouseover", evtFuncs.mouseOver);
			removeEvent(nodeList.gridCont, "mouseout", evtFuncs.mouseOut);
			removeEvent(nodeList.gridCont, "mousewheel", evtFuncs.mouseScroll);
			removeEvent(nodeList.gridCont, "DOMMouseScroll", evtFuncs.mouseScroll);
			removeEvent(nodeList.gridCont, "scroll", evtFuncs.scroll);
            removeEvent(nodeList.autoWidth, "click", evtFuncs.toggleWidth);
			opts.clickRows && removeEvent(nodeList.gridCont, "click", evtFuncs.respondTable);
			opts.resize && removeEvent(window, "resize", evtFuncs.resize);
			opts.tooltip && removeEvent(nodeList.gridCont, "mousemove", evtFuncs.tooltip);
            nodeList.tips && removeEvent(nodeList.tips, "mouseover", evtFuncs.showTips);
            nodeList.tips && removeEvent(nodeList.tips, "mouseout", evtFuncs.closeTips);
			nodeList.sort && removeEvent(nodeList.sort, "click", evtFuncs.sortOrder);
		},
		bindEvents: function () {
			addEvent(nodeList.btn, "click", evtFuncs.pageTurn);
			addEvent(nodeList.first, "click", evtFuncs.pageTurn);
			addEvent(nodeList.prev, "click", evtFuncs.pageTurn);
			addEvent(nodeList.next, "click", evtFuncs.pageTurn);
			addEvent(nodeList.last, "click", evtFuncs.pageTurn);
			addEvent(nodeList.gridCont, "mousedown", evtFuncs.gridContDown);
			addEvent(nodeList.gridCont, "mouseover", evtFuncs.mouseOver);
			addEvent(nodeList.gridCont, "mouseout", evtFuncs.mouseOut);
			addEvent(nodeList.gridCont, "mousewheel", evtFuncs.mouseScroll);
			addEvent(nodeList.gridCont, "DOMMouseScroll", evtFuncs.mouseScroll);
			addEvent(nodeList.gridCont, "scroll", evtFuncs.scroll);
			addEvent(nodeList.autoWidth, "click", evtFuncs.toggleWidth);
			opts.clickRows && addEvent(nodeList.gridCont, "click", evtFuncs.respondTable);
			opts.resize && addEvent(window, "resize", evtFuncs.resize);
			opts.tooltip && addEvent(nodeList.gridCont, "mousemove", evtFuncs.tooltip);
            nodeList.tips && addEvent(nodeList.tips, "mouseover", evtFuncs.showTips);
            nodeList.tips && addEvent(nodeList.tips, "mouseout", evtFuncs.closeTips);
			nodeList.sort && addEvent(nodeList.sort, "click", evtFuncs.sortOrder);
		},
		add: function (res) { //添加信息
			each(res, function (item) {
				if (getType(item) === "object") {
					item.__edit__ = true;
				}
				if (getType(item[config.groupName]) === "array") {
					custFuncs.add(item[config.groupName]);
				}
			});
		},
		clear: function (res) { //清除无用信息
			each(res, function (item) {
				if (getType(item) === "object") {
					delete item.__edit__;
				}
				if (getType(item[config.groupName]) === "array") {
					custFuncs.clear(item[config.groupName]);
				}
			});
		},
		clone: function (res, bool, reset) {
			!reset && custFuncs.resetSave();
			if (getType(res) === "array") {
				var result = [];
				each(res, function (v) {
					result.push(custFuncs.clone(v, bool, true));
				});
				return result;
			} else if (getType(res) === "object") {
				var obj = {};
				each(res, function (v, k) {
					if (!/^__([\S\s]+?)__$/.test(k) || bool === true) {
						obj[k] = custFuncs.clone(v, bool, true);
					}
				});
				return obj;
			}
			return res;
		},
		getPos: function (dom, x, y) {
			var w = dom.offsetWidth;
			var h = dom.offsetHeight;
			var total_w = node.offsetWidth;
			var total_h = node.offsetHeight;
			if (w + x + 20 > total_w) {
				x = x - w - 20;
			} else {
				x += 20;
			}
			if (h + y + 20 > total_h) {
				y = y - h - 20;
			} else {
				y += 20;
			}
			return {
				top: y,
				left: x
			};
		},
		clearId: function (node, cur) {
			var id = dataset.get(node, "forId");
			var inputNode = document.getElementById(id);
			if (inputNode) inputNode.removeAttribute("id");
			dataset.remove(node, "forId");
			if(cur && cur === nodeList.selectTime){
				inputNode.value = nodeList.timeHours.value + ":" + nodeList.timeMinutes.value;
			}
		},
		removeRows: function (obj) {
			var list = sizzle("tr", nodeList.table);
			var count = 0,
				result = [];
			custFuncs.resetSave(true);
			each(list, function (item, index) {
				var data = opts.data[index - count];
				each([].concat(obj.data), function (o) {
					if (data[obj.field] === (getType(o) === "object" ? o[obj.field] : o)) {
						//var nodeName = item.getAttribute("node-name");
						//if(nodeName){
						//    each([].concat(nodeList[nodeName]), function(d){
						//        d.parentNode.removeChild(d);
						//    });
						//}else{
						//    item.parentNode.removeChild(item);
						//}
						result.push(opts.data[index - count]);
						opts.data.splice(index - count++, 1);
						return false;
					}
				});
			});
			custFuncs.updatePage(opts.totalRows - result.length);
			custFuncs.resetSort(opts.data);
			custFuncs.addRows(opts.data, false);
			return custFuncs.clone(result);
		},
		removeByNode: function (node) {
			var result = [];
			try {
				if (getType(dataset.get(node, "index")) !== "string" && node.nodeName.toLowerCase() !== "tr") {
					node = closest(node, "tr");
					if (!node) return;
				}
				var index = dataset.get(node, "index");
				if (getType(index) === "string") {
					custFuncs.resetSave(true);
					result.push(opts.data[index]);
					//var nodeName = node.getAttribute("node-name");
					//if(nodeName){
					//    each([].concat(nodeList[nodeName]), function(d){
					//        d.parentNode.removeChild(d);
					//    });
					//}else{
					//    node.parentNode.removeChild(node);
					//}
					opts.data.splice(index, 1);
					custFuncs.updatePage(opts.totalRows - 1);
					custFuncs.resetSort(opts.data);
					custFuncs.addRows(opts.data, false);
				}
			} catch (e) {

			}
			return custFuncs.clone(result);
		},
		remove: function () {
			var result = [];
			custFuncs.resetSave(true);
			each(custFuncs.getSelect(true), function (item, index) {
				//var node = item.self.parentNode.parentNode;
				//var nodeName = node.getAttribute("node-name");
				//if(nodeName){
				//    each([].concat(nodeList[nodeName]), function(d){
				//        d.parentNode.removeChild(d);
				//    });
				//}else{
				//    node.parentNode.removeChild(node);
				//}
				result.push(opts.data[item.index - index]);
				opts.data.splice(item.index - index, 1);
			});
			custFuncs.resetSort(opts.data);
			custFuncs.updatePage(opts.totalRows - result.length);
			custFuncs.addRows(opts.data, false);
			return custFuncs.clone(result);
		},
        media: function(min, max){
            if(document.body.offsetWidth <= 1400){
                return min;
            }
            return max;
        },
		updateSelectData: function (data) {
			var list = custFuncs.getSelect(true);
			if (list.length === 0) return;
			if (getType(data) === "object") {
				opts.data[list[0].index] = data;
			} else if (getType(data) === "array") {
				each(list, function (item, index) {
					opts.data[item.index] = data[index];
				});
			}
			custFuncs.addRows(opts.data, false);
		},
		cacheMap: function (res, bool) {
			if (opts.cache.map && getType(res) === "object") {
				var field = res[opts.cache.field];
				if (getType(field) !== "undefined") {
					if (bool === true) {
						opts.cache.map[field] = res;
					} else {
						delete opts.cache.map[field];
					}
				}
			}
		},
		getCacheMap: function () {
			var result = [];
			if (opts.cache.map) {
				each(opts.cache.map, function (item) {
					result.push(item);
				});
			}
			return result;
		},
		loadCacheMap: function () {
			if (opts.cache.map) {
				custFuncs.checked({
					field: opts.cache.field,
					data: custFuncs.getCacheMap()
				});
			}
		},
		checkbox: function (self, bool) {
			var index = 0,
				group = null;
			if (!nodeList.checkbox) return;
			if (dataset.get(self, "type") === "top") {
				var topCheck = self.checked;
				if (topCheck) {
					className.add(self.parentNode, "label-checked");
				} else {
					className.remove(self.parentNode, "label-checked");
				}
				each(nodeList.checkbox, function (item) {
					item.checked = topCheck;
					index = dataset.get(item, "index");
					group = dataset.get(item, "group");
					if (topCheck) {
						opts.data[index].__check__ = true;
						custFuncs.cacheMap(opts.data[index], true);
						if (getType(group) === "string") {
							each(opts.data[index][config.groupName], function (o) {
								o.__check__ = true;
							});
							className.add(nodeList["rowSpan" + index], "selected");
						} else {
							className.add(custFuncs.parents(item, "tr"), "selected");
						}
					} else {
						delete opts.data[index].__check__;
						custFuncs.cacheMap(opts.data[index], false);
						if (getType(group) === "string") {
							each(opts.data[index][config.groupName], function (o) {
								delete o.__check__;
							});
							className.remove(nodeList["rowSpan" + index], "selected");
						} else {
							className.remove(custFuncs.parents(item, "tr"), "selected");
						}
					}
				});
				that.fire("checkbox", {
					checked: topCheck,
					node: self,
					all: true
				});
			} else {
				if (bool === true) self.checked = true;
				else if (bool === false) self.checked = false;
				index = dataset.get(self, "index");
				group = dataset.get(self, "group");
				if (self.checked) {
					opts.data[index].__check__ = true;
					custFuncs.cacheMap(opts.data[index], true);
					if (getType(group) === "string") {
						each(opts.data[index][config.groupName], function (o) {
							o.__check__ = true;
						});
						className.add(nodeList["rowSpan" + index], "selected");
					} else {
						className.add(custFuncs.parents(self, "tr"), "selected");
					}
				} else {
					if(nodeList.totalCheckbox) nodeList.totalCheckbox.checked = false;
					delete opts.data[index].__check__;
					custFuncs.cacheMap(opts.data[index], false);
					if (getType(group) === "string") {
						each(opts.data[index][config.groupName], function (o) {
							delete o.__check__;
						});
						className.remove(nodeList["rowSpan" + index], "selected");
					} else {
						className.remove(custFuncs.parents(self, "tr"), "selected");
					}
				}
				that.fire("checkbox", {
					checked: self.checked,
					node: self,
					all: false,
					data: custFuncs.clone(opts.data[index])
				});
			}
		},
		radio: function (self, bool) {
			if (bool === true) self.checked = true;
			else if (bool === false) self.checked = false;
			var dIndex = dataset.get(self, "index");
			var dGroup = dataset.get(self, "group");
			each(nodeList.checkbox, function (item) {
				var index = dataset.get(item, "index");
				var group = dataset.get(item, "group");
				if (opts.data[index].__check__ && index !== dIndex) {
					delete opts.data[index].__check__;
					custFuncs.cacheMap(opts.data[index], false);
					if (getType(group) === "string") {
						each(opts.data[index][config.groupName], function (o) {
							delete o.__check__;
						});
						className.remove(nodeList["rowSpan" + index], "selected");
					} else {
						className.remove(custFuncs.parents(item, "tr"), "selected");
					}
					return false;
				}
			});
			opts.data[dIndex].__check__ = true;
			custFuncs.cacheMap(opts.data[dIndex], true);
			if (getType(dGroup) === "string") {
				each(opts.data[dIndex][config.groupName], function (o) {
					o.__check__ = true;
				});
				className.add(nodeList["rowSpan" + dIndex], "selected");
			} else {
				className.add(custFuncs.parents(self, "tr"), "selected");
			}
			that.fire("radio", {
				data: opts.data[dIndex]
			});
		},
		moveUp: function () {
			custFuncs.moveSelectRow(false);
		},
		moveDown: function () {
			custFuncs.moveSelectRow(true);
		},
		moveSelectRow: function (bool) { //true下移，false上移
			var list = custFuncs.getSelect(true);
			var len = opts.data.length;
			custFuncs.resetSave(true);
			each(bool ? list.reverse() : list, function (obj) {
				var index = obj.index;
				var temp = null;
				if (bool) {
					if (index < len - 1) {
						temp = opts.data[index + 1];
						opts.data[index + 1] = opts.data[index];
						opts.data[index] = temp;
					}
				} else {
					if (index > 0) {
						temp = opts.data[index - 1];
						opts.data[index - 1] = opts.data[index];
						opts.data[index] = temp;
					}
				}
			});
			custFuncs.addRows(opts.data, false);
		},
		getChangeData: function () {
			var arr = [];
			each(opts.data, function (item) {
				if (item.__update__) {
					arr.push(item);
					delete item.__update__;
				}
			});
			return custFuncs.clone(arr);
		},
		getSelectChangeData: function () {
			var arr = [];
			each(custFuncs.getSelect(), function (item) {
				if (item.__update__) {
					arr.push(item);
					delete item.__update__;
				}
			});
			return custFuncs.clone(arr);
		},
		editToggleRow: function (node, bool) {
			var result = false;
			try {
				if(!isNode(node)) return result;
				custFuncs.clear(opts.data);
				opts.disabled = false;
				if (dataset.get(node, "type") === "top") {
					each(nodeList.checkbox, function (item) {
						var index = dataset.get(item, "index");
						if (getType(index) === "string") {
							opts.data[index].__o_edit__ = getType(bool) === "boolean" ? bool : !opts.data[index].__o_edit__;
							if(getType(opts.data[index][config.groupName]) === "array"){
								each(opts.data[index][config.groupName], function(item){
									item.__o_edit__ = getType(bool) === "boolean" ? bool : !item.__o_edit__;
								});
							}
						}
					});
				} else {
					if (getType(dataset.get(node, "index")) !== "string" && node.nodeName.toLowerCase() !== "tr") {
						node = closest(node, "tr");
						if (!node) return result;
					}
					var index = dataset.get(node, "index");
					if (getType(index) === "string") {
						opts.data[index].__o_edit__ = getType(bool) === "boolean" ? bool : !opts.data[index].__o_edit__;
						if(getType(opts.data[index][config.groupName]) === "array"){
							each(opts.data[index][config.groupName], function(item){
								item.__o_edit__ = getType(bool) === "boolean" ? bool : !item.__o_edit__;
							});
						}
					}
				}
				result = true;
				custFuncs.addRows(opts.data, false, true, true);
			} catch (e) {
				result = false;
			}
			return result;
		},
		editSelectToggle: function (bool) {
			custFuncs.clear(opts.data);
			var select = custFuncs.getSelect();
			if (select.length === 0) return;
			each(select, function (item) {
				item.__edit__ = true;
				if(getType(item[config.groupName]) === "array"){
					each(item[config.groupName], function(cItem){
						cItem.__edit__ = true;
					});
				}
			});
			custFuncs.edit(bool, true);
		},
		editItemData: function (bool) {
			custFuncs.edit(bool);
		},
		edit: function (bool, setEdit) { //进入编辑状态
			if (!bool) {
				opts.disabled = !opts.disabled;
			} else {
				opts.disabled = false;
			}
			custFuncs.addRows(opts.data, false, setEdit, true);
		},
		getTime: function (v) {
			var reg = /^(\d{4}-\d{1,2}-\d{1,2})/;
			if (reg.test(v)) {
				return new Date(v.replace(/\-/g, "/")).getTime();
			}else if(getType(v) === "object" && getType(v.__rows__) === "number"){
				return v.data;
			}
			return v;
		},
		sort: function (data, name, bool) {
			return data.sort(function (v1, v2) {
				var r1 = custFuncs.getTime(v1[name]),
					r2 = custFuncs.getTime(v2[name]);
				if (!isNaN(r1) && !isNaN(r2)) {
					if (bool) return r1 - r2;
					else if (!bool) return r2 - r1;
					else return -1;
				}
				return isNaN(r1) ? 1 : -1;
			});
		},
		preventPage: function(){
			if(getType(config.cache.page.prevValue) === "undefined" || opts.curPage === config.cache.page.prevValue) return;
			if(config.cache.page.node === null){
				opts.curPage = parseInt(config.cache.page.prevValue);
			}else{
				config.cache.page.node.value = config.cache.page.prevValue;
				opts.pageSize = parseInt(config.cache.page.prevValue);
			}
			custFuncs.setPage();
		},
		restorePage: function(){
			if(getType(config.cache.page.curValue) === "undefined" || opts.curPage === config.cache.page.curValue) return;
			if(config.cache.page.node === null){
				opts.curPage = parseInt(config.cache.page.curValue);
			}else{
				config.cache.page.node.value = config.cache.page.curValue;
				opts.pageSize = parseInt(config.cache.page.curValue);
			}
			custFuncs.setPage();
		},
		getSelect: function (bool, name) {
			var result = [];
			if (!nodeList.checkbox) return result;
			each(nodeList.checkbox, function (item, index) {
				if (item.checked) {
					if (bool === true) {
						result.push({
							self: item,
							index: index
						});
					} else if (typeof name === "undefined") {
						result.push(opts.data[index]);
					} else if (getType(name) === "string") {
						var obj = {};
						obj[name] = opts.data[index][name];
						result.push(obj);
					}
				}
			});
			return result;
		},
		getAllData: function (name) {
			if (getType(name) === "string") {
				var result = [];
				each(opts.data, function (item, index) {
					var obj = {};
					obj[name] = opts.data[index][name];
					result.push(obj);
				});
				return custFuncs.clone(result);
			}
			return custFuncs.clone(opts.data);
		},
		getSelectNodes: function () {
			var result = [];
			each(custFuncs.getSelect(true), function (obj) {
				try {
					result.push(custFuncs.parents(obj.self, "tr"));
				} catch (e) {}
			});
			return result;
		},
		getSelectData: function () { //获取选中的数据
			var result = custFuncs.getCacheMap();
			if (result.length > 0) {
				return custFuncs.clone(result);
			}
			return custFuncs.clone(custFuncs.getSelect(false, arguments[0]));
		},
		getSelectConvertData: function (obj) {
			var result = custFuncs.clone(custFuncs.getSelect(false));
			var format = "";
			if (getType(obj) === "object") {
				if (obj.format) {
					format = obj.format;
				}
			}
			var types = {};
			if (obj.names) {
				each(obj.names, function (v) {
					types[v] = {
						format: "yyyy-MM-dd HH:mm:ss"
					};
				});
			}
			each(opts.columns, function (v) {
				if (v.dataType === "date") {
					types[v.name] = {
						format: v.format || "yyyy-MM-dd HH:mm:ss"
					};
				}
			});
			each(result, function (item) {
				each(item, function (v, k) {
					if (types[k]) {
						if (format === "") format = types[k].format;
						item[k] = formatDate(item[k], format);
					}
				});
			});
			return result;
		},
		changeWidth: function (x, index) {
			var item = opts.columns[index];
			x = Math.max(item.minWidth - item.width, x);

			setStyle(nodeList.gridTitle, {
				width: (opts.width + x) + "px"
			});
			nodeList.table && setStyle(nodeList.table, {
				width: (opts.width + x) + "px"
			});

			setStyle(item.self, {
				width: item.width + x - item.lastValue + "px"
			});
			var info = opts.groupInfo[index];
			if (info) {
				custFuncs.parentSet(info, x);
			}
			nodeList.td && setStyle(nodeList.td[index], {
				width: item.width + x + "px"
			});
		},
		parentSetSave: function (info, x) {
			if(getType(info) !== "object") return;
			if(info.id){
				var obj1 = opts.groupInfo.map[info.id];
				obj1.width += x;
			}
			if(info.firstId){
				var obj2 = opts.groupInfo.map[info.firstId];
				obj2.width += x;
			}
			custFuncs.parentSetSave(info.parent, x);
		},
		parentSet: function (info, x) {
			if(getType(info) !== "object") return;
			if(info.id){
				var obj1 = opts.groupInfo.map[info.id];
				setStyle(obj1.self, {
					width: obj1.width + x + "px"
				});
			}
			if(info.firstId){
				var obj2 = opts.groupInfo.map[info.firstId];
				setStyle(obj2.self, {
					width: obj2.width + x + "px"
				});
			}
			custFuncs.parentSet(info.parent, x);
		},
		formatOption: function(data){
			var arr = [];
			if(getType(data) === "object"){
				each(data, function (v, k) {
					arr.push({
						"key": k,
						"val": v
					});
				});
				return arr;
			}
			return data;
		},
		getStatusList: function () {
			return opts.map;
		},
		setStatusList: function (name, list) {
			if (getType(name) === "object") {
				each(name, function (item, key) {
					custFuncs.setStatusList(key, item);
				});
				return;
			}
			var result = null,
				arr = null;
			if (getType(list) === "object") {
				arr = custFuncs.formatOption(list);
				result = list;
			} else if (getType(list) === "array") {
				result = {};
				arr = list;
				each(list, function (item) {
					result[item.key] = item.val;
				});
			} else return;

			if(opts.allowEmpty === true || (getType(opts.allowEmpty) === "array" && opts.allowEmpty.indexOf(name) > -1)){
				arr.unshift({key: "", val: opts.allowEmptyText});
			}
			opts.map[name] = arr;
			var cache = getType(config.cache.data.columns) === "array";
			each(opts.columns, function (item, index) {
				if (item.name === name) {
					item.render = function (v) {
						return result[v];
					};

					if (cache) {
						config.cache.data.columns[index].render = item.render;
					}

					if (item.type === "select") {
						item.options = arr;
						if (cache) {
							config.cache.data.columns[index].options = arr
						}
					}
				}

				if (getType(item.tooltips) === "array") {
					each(item.tooltips, function (tip) {
						if (tip.name === name) {
							tip.render = function (v) {
								return result[v];
							};
							return false;
						}
					});
					if (cache) {
						config.cache.data.columns[index].tooltips = custFuncs.clone(item.tooltips, false, true);
					}
				}
			});
		},
		unChecked: function (obj) {
			custFuncs.selectRows(obj, false);
		},
		checked: function (obj) {
			custFuncs.selectRows(obj, true);
		},
		selectRows: function (obj, bool) {
			if (!nodeList.checkbox) return false;
			var filter = getType(obj) === "function";
			each(nodeList.checkbox, function (item, index) {
				var data = opts.data[index];
				if(filter){
					if(obj(data) === true){
						if (opts.selectType === "checkbox") {
							bool && !item.checked && custFuncs.checkbox(item, bool);
							!bool && item.checked && custFuncs.checkbox(item, bool);
						} else if (opts.selectType === "radio") {
							bool && !item.checked && custFuncs.radio(item, bool);
							!bool && item.checked && custFuncs.radio(item, bool);
						}
					}
					return;
				}
				each([].concat(obj.data), function (o) {
					if (data[obj.field] === (getType(o) === "object" ? o[obj.field] : o)) {
						if (opts.selectType === "checkbox") {
							bool && !item.checked && custFuncs.checkbox(item, bool);
							!bool && item.checked && custFuncs.checkbox(item, bool);
						} else if (opts.selectType === "radio") {
							bool && !item.checked && custFuncs.radio(item, bool);
							!bool && item.checked && custFuncs.radio(item, bool);
						}
						return false;
					}
				});
			});
			return true;
		},
		replaceSelectRows: function (data) {
			try {
				var result = [].concat(custFuncs.clone(data));
				each(custFuncs.getSelect(true), function (item, index) {
					if (getType(result[index]) === "object") {
						var sortIndex = opts.data[item.index].__sort_index__;
						var order = opts.data[item.index].__order__;
						opts.data[item.index] = result[index];
						opts.data[item.index].__change__ = true;
						opts.data[item.index].__sort_index__ = sortIndex;
						opts.data[item.index].__order__ = order;
					}
				});
				custFuncs.addRows(opts.data, false);
			} catch (e) {}
		},
		mergeSelectRows: function (data) {
			try {
				var result = [].concat(custFuncs.clone(data));
				each(custFuncs.getSelect(true), function (item, index) {
					if (getType(result[index]) === "object") {
						opts.data[item.index] = merge(opts.data[item.index], result[index]);
						opts.data[item.index].__change__ = true;
					}
				});
				custFuncs.addRows(opts.data, false);
			} catch (e) {}
		},
		replaceRow: function (data, node) {
			try {
				if (getType(data) === "object" && isNode(node)) {
					if (getType(dataset.get(node, "index")) !== "string" && node.nodeName.toLowerCase() !== "tr") {
						node = closest(node, "tr");
						if (!node) return;
					}
					var index = dataset.get(node, "index");
					var sortIndex = opts.data[index].__sort_index__;
					var order = opts.data[index].__order__;
					opts.data[index] = custFuncs.clone(data);
					opts.data[index].__change__ = true;
					opts.data[index].__sort_index__ = sortIndex;
					opts.data[index].__order__ = order;
					custFuncs.addRows(opts.data, false);
				}
			} catch (e) {
				console.log("替换出错", e);
			}
		},
		mergeRow: function (data, node) {
			try {
				if (getType(data) === "object" && isNode(node)) {
					if (getType(dataset.get(node, "index")) !== "string" && node.nodeName.toLowerCase() !== "tr") {
						node = closest(node, "tr");
						if (!node) return;
					}
					var index = dataset.get(node, "index");
					opts.data[index] = merge(opts.data[index], custFuncs.clone(data));
					opts.data[index].__change__ = true;
					custFuncs.addRows(opts.data, false);
				}
			} catch (e) {
				console.log("合并出错", e);
			}
		},
		insertRows: function (res, dom, pos) {
			if(getType(res) !== "object" && getType(res) !== "array") return;
			custFuncs.add();
			custFuncs.resetSave(true);
			opts.data = custFuncs.getOriginalData(opts.data, true);
			if(config.cache.sort.name){
				config.cache.sort.node.className = "serial";
                dataset.set(config.cache.sort.node, "type", 0);
				config.cache.sort.node.title = "还原";
				opts.columns[config.cache.sort.index].sort = "serial";
				config.cache.sort = {};
			}
			var index = null;
			if(isNode(dom)){
				if (getType(dataset.get(dom, "index")) !== "string" && dom.nodeName.toLowerCase() !== "tr") {
					dom = closest(dom, "tr");
					if (!dom) return;
					index = parseInt(dataset.get(dom, "index"));
				}
				pos = pos !== "after" ? "before" : pos;
			}else{
				pos = dom !== "after" ? "before" : dom;
			}

			var result = [].concat(res);
			var len = result.length;
			if(getType(index) === "number"){
				if (pos === "before") { //默认插在最前面
					opts.data.splice.apply(opts.data, [index, 0].concat(result));
				} else if (pos === "after") {
					if(index === opts.data.length - 1){
						opts.data.push.apply(opts.data, result);
					}else{
						opts.data.splice.apply(opts.data, [index + 1, 0].concat(result));
					}
				}
			}else{
				if (pos === "before") { //默认插在最前面
					opts.data.unshift.apply(opts.data, result);
				} else if (pos === "after") {
					opts.data.push.apply(opts.data, result);
				}
			}

			custFuncs.updatePage(opts.totalRows + len);
			custFuncs.clearButMsg();
			custFuncs.addRows(opts.data, false);
		},
		addRowsData: function (res) {
			var result = res;
			if(getType(res) === "object"){
				result = [].concat(res);
			}
			opts.disabled = config.cache.data.disabled;
			custFuncs.clearButMsg();
			custFuncs.addRows(res);
			config.cache.data.back && custFuncs.autoWidth(result);
		},
		addRows: function (res, saveData, setEdit, cancelTop) {
			custFuncs.setGridCont(false);
			if (getType(res) === "array" && res.length > 0) {
				if (saveData !== false) saveData = true;
				var data = custFuncs.clone(res, true, saveData);
				if (setEdit !== true) custFuncs.add(data);
				custFuncs.setSortOrder(data);
				opts.data = data;
				config.status.group = false;
				var cloneData = custFuncs.clone(data, true, true);
				if (getType(opts.dataGroup) === "object") {
					custFuncs.formatRows(cloneData);
					opts.resourse = custFuncs.formatGroup(cloneData);
				} else {
					opts.resourse = cloneData;
				}
				if (config.cache.sort.name) {
					opts.data = custFuncs.sort(opts.data, config.cache.sort.name, config.cache.sort.bool);
					opts.resourse = custFuncs.sort(opts.resourse, config.cache.sort.name, config.cache.sort.bool);
				}
				nodeList.gridCont.innerHTML = custFuncs.renderHTML(gridContRender(opts));
				nodeList = merge(nodeList, parseModule(nodeList.gridCont));
				if(getType(nodeList.td) !== "array") nodeList.td = [].concat(nodeList.td);
				nodeList.inputs = sizzle(".u-input", nodeList.gridCont);
				delete nodeList.gridWarn;
				if (nodeList.checkbox) nodeList.checkbox = [].concat(nodeList.checkbox);
				if (nodeList.totalCheckbox && cancelTop !== true){
					nodeList.totalCheckbox.checked = false;
					var parentNode = nodeList.totalCheckbox.parentNode;
					if(className.has(parentNode, "label-checked")){
						className.remove(parentNode, "label-checked");
					}
				}
				custFuncs.scrollBar();
				custFuncs.reToolbar();
				custFuncs.loadCacheMap();
				custFuncs.setTitle();
				custFuncs.setResize();
			} else {
				opts.data = [];
				if(nodeList.gridWarn) return;
				delete opts.resourse;
				delete nodeList.checkbox;
				delete nodeList.inputs;
				nodeList.gridCont.innerHTML = "<div class='grid-warn'><i></i><span>暂无数据！</span></div>";
				var gridWarn = document.createElement("DIV");
				gridWarn.style.width = custFuncs.unit(opts.width);
				gridWarn.style.height = "64px";
				nodeList.gridCont.appendChild(gridWarn);
				nodeList.gridWarn = gridWarn;
			}

			setTimeout(function(){
				custFuncs.setGridCont(true);
				custFuncs.loadScroll();
				that.fire("addRows");
			}, 10);
		},
		setGridCont: function(bool){
			nodeList.gridCont.style.overflow = bool ? "auto" : "hidden";
		},
		clearButMsg: function(){
			try{
				each(opts.columns, function(item, index){
					if(getType(item.buts) === "array"){
						each(item.buts, function(but, i){
							delete but.index;
							delete config.cache.data.columns[index].buts[i].index;
						});
					}
				});
			}catch(e){}
		},
		slideHorizontalScroll: function(value){
			if(!className.has(nodeList.gridBottomScroll, "hide") && (className.has(nodeList.gridRightScroll, "hide") || config.status.down)){
				var w = nodeList.gridCont.offsetWidth;
				var sw = nodeList.gridCont.scrollWidth;
				var left = nodeList.gridCont.scrollLeft;
				if((value > 0 && sw - w === left) || (value < 0 && left === 0))  return;

				nodeList.gridCont.scrollLeft += value;
				left = nodeList.gridCont.scrollLeft;
				if(sw - w === left){
					var bgLength = nodeList.scrollBottomBg.offsetWidth;
					var bsLength = nodeList.bottomScrollTool.offsetWidth;
					var len = bgLength - bsLength;
					nodeList.bottomScrollTool.style.left = custFuncs.unit(len);
				}else{
					nodeList.bottomScrollTool.style.left = custFuncs.unit(left * (w - 17) / sw);
				}
				config.status.scroll = true;
				clearTimeout(p_timer);
				p_timer = setTimeout(function(){
					config.status.scroll = false;
					p_timer = null;
				}, 2000);
			}
		},
		loadScroll: function(){
			var left = nodeList.gridCont.scrollLeft;
			var top = nodeList.gridCont.scrollTop;
			nodeList.gridCont.scrollLeft = 1;
			nodeList.gridCont.scrollTop = 1;
			removeEvent(nodeList.bottomScrollTool, "mousedown", evtFuncs.scrollBottomTool);
			removeEvent(nodeList.rightScrollTool, "mousedown", evtFuncs.scrollRightTool);
			var bottomIsScroll = false;
			if(nodeList.gridCont.scrollLeft > 0){
				bottomIsScroll = true;
				nodeList.gridCont.scrollLeft = left;
				var w = nodeList.gridCont.offsetWidth;
				var sw = nodeList.gridCont.scrollWidth;
				setStyle(nodeList.gridBottomScroll, {
					bottom: custFuncs.unit(opts.show ? 54 : 0),
					width: custFuncs.unit(w)
				});
				className.remove(nodeList.gridBottomScroll, "hide");
				var toolWidth = Math.max((w - 34) * (w - 34) / sw, w * 2 - sw - 34);
				nodeList.bottomScrollTool.style.width = custFuncs.unit(toolWidth);
				nodeList.bottomScrollTool.style.left = custFuncs.unit(left * (w - 17) / sw);
				addEvent(nodeList.bottomScrollTool, "mousedown", evtFuncs.scrollBottomTool);
				config.status.initStatus = false;
			}else{
				className.add(nodeList.gridBottomScroll, "hide");
			}
			if(nodeList.gridCont.scrollTop > 0){
				nodeList.gridCont.scrollTop = top;
				var h = nodeList.gridCont.offsetHeight;
				var sh = nodeList.gridCont.scrollHeight;
				setStyle(nodeList.gridRightScroll, {
					top: custFuncs.unit(nodeList.gridHeader.offsetHeight - 1),
					height: custFuncs.unit(h)
				});
				nodeList.scrollRightBg.style.height = custFuncs.unit(h - 34);
				className.remove(nodeList.gridRightScroll, "hide");
				var toolHeight = (h - 17 * (bottomIsScroll ? 2 : 1)) * (h - 17 * (bottomIsScroll ? 2 : 1)) / sh;
				nodeList.rightScrollTool.style.height = custFuncs.unit(toolHeight);
				nodeList.rightScrollTool.style.top = custFuncs.unit(top * h / sh);
				addEvent(nodeList.rightScrollTool, "mousedown", evtFuncs.scrollRightTool);
			}else{
				className.add(nodeList.gridRightScroll, "hide");
			}
		},
		setSortOrder: function (res) {
			each(res, function (item, index) {
				if (getType(item.__order__) === "undefined") {
					item.__order__ = (index + 1) + (opts.curPage - 1) * opts.pageSize;
				}
				if (getType(item.__sort_index__) === "undefined") {
					item.__sort_index__ = index;
				}
			});
			if(!opts.fieldMap.__order__){
                opts.fieldMap.__order__ = {};
			}
		},
		resetSort: function(res){
			var result = [];
			each(res, function (item) {
				result[item.__sort_index__] = item;
			});
			var count = 0;
			each(result, function(item, index){
				if(result[index]){
					item.__order__ = (count + 1) + (opts.curPage - 1) * opts.pageSize;
					item.__sort_index__ = count;
					count++;
				}
			});
		},
		getOriginalData: function (res, isDel) {
			var result = [];
			each(res, function (item) {
				result[item.__sort_index__] = item;
				isDel && delete item.__sort_index__;
				isDel && delete item.__order__;
			});
			return result;
		},
		reToolbar: function () {
			var list = sizzle("[data-action=move]", nodeList.gridHeader);
			if (config.status.group) {
				className.add(list, "hide");
			} else {
				className.remove(list, "hide");
			}
		},
		createNode: function(tagName, attr, style, content){
			var tag = document.createElement(tagName);
			if(getType(attr) === "object"){
				each(attr, function(v, k){
					if(k in tag){
						tag[k] = v;
					}else{
						tag.setAttribute(k, v);
					}
				});
			}
			if(getType(style) === "object"){
				setStyle(tag, style);
			}
		},
		renderHTML: function (code) {
            var reg = /##renderHTML\[([\s\S]+?)\]##/g;
			try {
				var buts = [], pass = false;
				each(opts.columns, function(item){
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

						var value = data[obj.name];
						if (getType(obj.groupIndex) === "string") {
                            value = filter(data, obj.groupIndex);
						}

						return sNull(col.renderHTML(value, data, {
							getButs: arrayButs,
							buts: custFuncs.getButHTML
						})).replace(/\<%=([\S\s]+?)\%>/g, function (a, b) {
							return data[b.replace(/(^\s*)|(\s*$)/g, "")];
						});
					}
					return "";
				});
			} catch (e) {
				return code.replace(reg, e);
			}
		},
		getButHTML: function (list) {
			var buts = [].concat(list);
			var code = '';
			each(buts, function (obj) {
				if (getType(obj) !== "object") return;
				code += '<a href="javascript:void(0)" ' + (function () {
						if (getType(obj.data) !== "object") {} else {
							return "data-query=" + JSON.stringify(obj.data)
						}
						return ""
					})() + ' data-event="' + obj.id + '" title="' + obj.text + '">' + obj.text + '</a>';
			});
			return code;
		},
		unit: function (v) {
			if (!isNaN(v)) {
				return v + "px";
			}
			return v;
		},
        recursiveFirst: function(obj, vObj){
            each(vObj, function(v, k){
            	if(!obj[k]) obj[k] = v;
                if(getType(v) === "array" && k === config.groupName){
                    custFuncs.recursiveFirst(obj, v[0]);
                }
            });
		},
        getFirstObj : function(obj){
			var nObj = {};
			each(obj, function(v, k){
				nObj[k] = v;
				if(getType(v) === "array" && k === config.groupName){
					custFuncs.recursiveFirst(nObj, v[0]);
                    each(v, function(item, index){
                        if(index > 0 && custFuncs.isArray(item[config.groupName])){
                            nObj[k][index] = custFuncs.getFirstObj(item);
                        }
                    });
				}
			});
			return nObj;
		},
		eachGroup: function (res, bool, name) {
			var obj = {};
			each(res, function (v, key) {
				if (/^__([\S\s]+?)__$/.test(key)) {
					obj[key] = v;
					return;
				}
				if (getType(v) === "array" && key === config.groupName) {
					obj[key] = v;
					each(v, function (item, index) {
						obj[key][index] = custFuncs.eachGroup(item, true, sNull(name) + key+ "[" + index + "].");
					});
				} else {
					obj[key] = {
						__rows__: res.__rows__,
						data: v,
						name: name ? name + key : "",
						isGroup: bool
					};
				}
			});
			return obj;
		},
		formatGroup: function (res) {
			var arr = [];
			each(res, function (item) {
				if (custFuncs.isArray(item[config.groupName])) {
					arr.push(custFuncs.getFirstObj(custFuncs.eachGroup(item)));
				} else {
					arr.push(item);
				}
			});
			return arr;
		},
		getRowSpan: function (res) {
			var rows = 0;
			each(res, function (item) {
				if (custFuncs.isArray(item[config.groupName])) {
					rows += custFuncs.getRowSpan(item[config.groupName]);
				} else {
					rows += (res.length === 1 ? 0 : 1);
				}
			});
			return rows;
		},
		formatRows: function (res) {
			each(res, function (item, index) {
				var rows = [1];
				if (custFuncs.isArray(item[config.groupName])) {
					var total = custFuncs.getRowSpan(item[config.groupName]);
					if (item[config.groupName].length > 1 || total > 1) {
						rows.push(total);
						custFuncs.formatRows(item[config.groupName]);
					} else {
						res[index] = merge(item, item[config.groupName][0]);
						delete res[index][config.groupName];
					}
				} else {
					delete item[config.groupName];
				}
				res[index].__rows__ = Math.max.apply(null, rows);
				if (res[index].__rows__ > 1) config.status.group = true;
			});
		},
		movePos: function (x, index) {
			opts.columns[index].width += x;
			opts.width += x;
			nodeList.gridWarn && (nodeList.gridWarn.style.width = custFuncs.unit(opts.width));
			var info = opts.groupInfo[index];
			custFuncs.parentSetSave(info, x);
		},
		getPointNodes: function (str, node) {
			try {
				var reg1 = /^([\s\S]+?)\[([\s\S]+?)\]([\s\S]+?)$/g;
				var reg2 = /^([\s\S]+?)\[([\s\S]+?)\]([\s\S]+?)\[([\s\S]+?)\]([\s\S]+?)$/g;

				if (getType(node) === "undefined" && reg2.test(str) && RegExp.$1 === "rows") {
					var index = RegExp.$2;
					node = sizzle("tr", nodeList.table)[index];
					str = str.match(/([\s\S]+?)\[([\s\S]+?)\]([\s\S]+?)$/)[3];
				}

				if (!isNode(node)) return null;

				if (node.offsetWidth === 0) {
					node = sizzle("tr", nodeList.table)[dataset.get(node, "index")];
				} else if (node.nodeName.toLowerCase() !== "tr") {
					node = closest(node, "tr");
				}

				if (!node) return null;

				if (reg1.test(str) && RegExp.$1 === "cols") {
					var subs = RegExp.$2;
					var result = [];
					var list = sizzle("td " + RegExp.$3, node);
					each(subs.split(","), function (index) {
						result.push(list[index]);
					});
					return result.length === 1 ? result[0] : result;
				}
			} catch (e) {

			}
			return null;
		},
		parents: function (node, sel) {
			try {
				var count = 0;
				while (node.nodeName.toLowerCase() !== sel && count <= 5) {
					node = node.parentNode;
					count++;
				}
			} catch (e) {}
			return node;
		},
		changeAutoCalStatus: function(bool, anyBool){
            if(bool){
                config.cache.data.back = {
                    columns: custFuncs.clone(config.cache.data.columns),
                    width: config.cache.data.width,
					bool: anyBool,
					list: []
                };
                nodeList.autoWidth.innerHTML = "关闭自动计算";
            }else{
                config.cache.data.columns = config.cache.data.back.columns;
                config.cache.data.width = config.cache.data.back.width;
                delete config.cache.data.back;
                nodeList.autoWidth.innerHTML = "启动自动计算";
            }
		},
		scrollBar: function () {
			config.status.initStatus = true;
			var left = 0,
				index = opts.columns.length - 1;
			var scrollTop = nodeList.gridCont.scrollTop;
			nodeList.gridCont.scrollTop = 1;
			if (config.status.firstLoad && nodeList.gridCont.scrollTop > 0 && opts.parent_width - opts.width < 20 && opts.parent_width - opts.width > 0) {
				left = -20;
			} else if (config.status.firstLoad && nodeList.gridCont.scrollTop === 0 && opts.parent_width - opts.width >= 20) {
				left = 20;
			}
			if (config.status.firstLoad && dataset.get(nodeList.gridCont, "auto") === "true") {
				nodeList.gridCont.scrollLeft = 1000;
				if (nodeList.gridCont.scrollLeft > 0) {
					left += -Math.max(0, (nodeList.gridCont.scrollLeft + left));
				}
			}

			if (left !== 0) {
				custFuncs.changeWidth(left, index);
				custFuncs.movePos(left, index);
			}
			nodeList.gridCont.scrollTop = scrollTop;
			config.status.initStatus = false;
		},
		setPageOffset: function(num){
			if(/^\d+\.?\d*$/.test(num)){
				custFuncs.updatePage(parseInt(opts.totalRows) + parseInt(num));
			}
		},
		updatePage: function (totalRows, curPage) {
			opts.totalRows = sNull(parseInt(totalRows), 0);
			if (getType(curPage) === "number") opts.curPage = parseInt(curPage);
			if (nodeList.totalCheckbox) nodeList.totalCheckbox.checked = false;
			custFuncs.setPage();
		},
		getAttr: function(obj){
			var attr = [];
			var helis = {disabled: true, readonly: true};
			if(getType(obj) === "object"){
				each(obj, function(v, k){
					if(helis[k]){
						v && attr.push(k + '=\"'+ k + '\"');
					}else{
						attr.push(k + '=\"'+ v + '\"');
					}
				});
			}
			return attr.join(" ");
		},
		mergeOptions: function(opts1, opts2){
			if(opts2.columns){
				each(opts2.columns, function(item1){
					var bool = true;
					each(opts1.columns, function(item2, index){
						if(item1.name === item2.name){
                            opts1.columns[index] = merge(item2, item1);
                            bool = false;
                            return false;
						}
					});
					bool && opts1.columns.push(item1);
				});
				return opts1;
			}else{
				return merge(opts1, opts2);
			}
		},
		setResize: function() {
			if(opts.resize === false) return;
			opts.resize = {h: document.body.offsetHeight, w: document.body.offsetWidth};
		},
		setTitle: function () {
			if (opts.title === true && opts.tooltip !== true) {
				each(sizzle(".text", nodeList.gridCont), function (item) {
					var list = opra.childNodes(item);
					if (list.length === 0) {
						item.title = item.innerHTML.trim();
					}
				});
			}
		},
		setOptions: function (opt) {
			if (getType(opt) === "object" && custFuncs.getInitStatus()) {
				var data = opts.data;
				var map = custFuncs.getStatusList();
				opts = custFuncs.mergeOptions(config.cache.data.initOptions, opt);
                custFuncs.unbindEvents();
                custFuncs.dataBackups(1);
                custFuncs.initProperty();
                custFuncs.initData(opts.totalCols);
                custFuncs.setTopRows(opts.totalCols);
                custFuncs.dataBackups(2);
                opts.data = data;
                custFuncs.setStatusList(map);
                custFuncs.initView();
			}
		},
		setPage: function () {
			opts.totalPages = Math.ceil(opts.totalRows / opts.pageSize);
			opts.curPage = Math.min(Math.max(1, opts.totalPages), opts.curPage);
			nodeList.pageSize.value = opts.pageSize;
			nodeList.page.value = opts.curPage;
			nodeList.text.innerHTML = "当前" + Math.min(opts.totalRows, (opts.curPage - 1) * opts.pageSize + 1) + "到" + Math.min(opts.totalRows, opts.curPage * opts.pageSize) + "条，总共" + opts.totalRows + "条";
			nodeList.total.innerHTML = Math.min(opts.totalPages, opts.curPage) + " / " + opts.totalPages;
            dataset.set(nodeList.first, "value", 1);
            dataset.set(nodeList.prev, "value", Math.max(1, opts.curPage - 1));
            dataset.set(nodeList.next, "value", Math.min(Math.max(1, opts.totalPages), opts.curPage + 1));
            dataset.set(nodeList.last, "value", Math.max(1, opts.totalPages));
			if (opts.curPage === 1) {
				className.add([nodeList.first, nodeList.prev], "gray");
			} else {
				className.remove([nodeList.first, nodeList.prev], "gray");
			}
			if (opts.curPage >= opts.totalPages) {
				className.add([nodeList.last, nodeList.next], "gray");
			} else {
				className.remove([nodeList.last, nodeList.next], "gray");
			}
			if (opts.totalPages <= 1) {
				className.add(nodeList.btn, "gray");
			} else {
				className.remove(nodeList.btn, "gray");
			}
		},
		pageToggle: function (bool) {
			if (bool === true) {
				nodeList.gridPage.style.height = "54px";
				nodeList.gridPage.style.overflow = "visible";
			} else if (bool === false) {
				nodeList.gridPage.style.height = "0px";
				nodeList.gridPage.style.overflow = "hidden";
			} else {
				if (nodeList.gridPage.offsetHeight === 0) {
					custFuncs.pageToggle(true);
				} else {
					custFuncs.pageToggle(false);
				}
			}
		},
		changeDataValue: function (index, groupIndex, name, value) {
			try {
				if (getType(groupIndex) === "string") {
                    objectSet(opts.data[index], groupIndex, value);
				} else {
					if (getType(opts.data[index][name]) !== "undefined") {
						opts.data[index][name] = value;
					}
				}
			} catch (e) {}
		},
		resetSave: function (bool) {
			if(!nodeList) return;
			nodeList.inputs && each(nodeList.inputs, function (item) {
				try {
					var index = dataset.get(item, "index");
					var name = dataset.get(item, "name");
					var groupIndex = dataset.get(item, "group");
					if (getType(opts.data[index]) === "object") {
						if(opts.data[index].__change__){
							return;
						}
						custFuncs.changeDataValue(index, groupIndex, name, item.value);
					}
				} catch (e) {}
			});

			each(opts.data, function(item){
				delete item.__change__;
			});

			if(bool === true){
				delete nodeList.inputs;
			}
		},
		initView: function () {
			clearTimeout(p_timer);
			p_timer = setTimeout(function () {
				var x = nodeList.gridCont.scrollLeft;
				var y = nodeList.gridCont.scrollTop;
				custFuncs.unbindEvents();
				var sty = {};
				each(node.style, function (v) {
					if (v.indexOf("width") === -1) {
						sty[v] = node.style[v];
					}
				});
				node.removeAttribute("style");
				setStyle(node, sty);
				nodeList.gridHeader.removeAttribute("style");
				opts.width = config.cache.data.width;
                opts.titleHeight = custFuncs.media(32, config.cache.data.titleHeight);
                opts.rowHeight = custFuncs.media(32, config.cache.data.rowHeight);
				opts.columns = custFuncs.clone(config.cache.data.columns);
				node.innerHTML = gridRender(opts);
				nodeList = parseModule(node);
                if(config.cache.data.back){
                	nodeList.autoWidth.innerHTML = "关闭自动计算";
                }
				custFuncs.bindEvents();
				config.status.initStatus = true;
                config.status.firstLoad = true;
				custFuncs.initGrid();
				custFuncs.addRows(opts.data, false, true, true);
				nodeList.gridCont.scrollLeft = x;
				nodeList.gridCont.scrollTop = y;
			}, 50);
		},
		reload: function (columns, data) {
			opts.columns = columns;
			init();
			custFuncs.insertRows(data || opts.data);
		},
		initChild: function(nodes, cols){
			each(nodes, function(item){
				if(className.has(item, "end")) return;
				if(dataset.get(item, "child")){
					var total = 0;
					each(sizzle(".end", item), function (d) {
						var index = parseInt(dataset.get(d, "index"));
						total += cols[index].width;
					});
					var len = dataset.get(item, "last") ? 1 : 0;
					item.style.width = custFuncs.unit(total - len);
					dataset.set(item, "mapId", base.getUniqueId());
					if(len === 1) item.style.borderRight = "0 none";
					var first = opra.first(item);
					if(!className.has(first, "end")){
						first.style.width = custFuncs.unit(total - len);
						dataset.set(first, "mapId", base.getUniqueId());
						if(len === 1) first.style.borderRight = "0 none";
					}
					var childNodes = opra.childNodes(item);
					custFuncs.initChild(childNodes, cols, false);
				}
			});
		},
		setParentData: function(parent){
			var obj = {};
			if(parent && dataset.get(parent, "child")){
				var first = opra.first(parent);
				var firstId = dataset.get(first, "mapId");
				if(!opts.groupInfo.map[firstId]){
					opts.groupInfo.map[firstId] = {width: first.offsetWidth, self: first};
				}
				obj.firstId = firstId;
				var id = dataset.get(parent, "mapId");
				if(!opts.groupInfo.map[id]){
					opts.groupInfo.map[id] = {width: parent.offsetWidth, self: parent};
				}
				obj.id = id;
				obj.parent = custFuncs.setParentData(parent.parentNode);
			}
			return obj;
		},
		initGroup: function () {
			nodeList.gridHeader.style.width = "100000px";
			className.remove(nodeList.gridHeader, "hide");
			var cols = opts.columns;
			var list = sizzle(".td", nodeList.gridHeader);
			var listNodes = opra.childNodes(nodeList.gridHeader);
			var totalList = sizzle(".end", nodeList.gridHeader);
			var selectType = (opts.selectType === "checkbox" || opts.selectType === "radio");
			var order = (opts.order === true);
			selectType && listNodes.splice(0, 1);
			order && listNodes.splice(0, 1);
			opts.groupInfo.map = {};

			//设置每列长度
			each(totalList, function (item, index) {
				if(dataset.get(item, "last")){
					setStyle(item, {
						borderRight: "0 none",
						minWidth: custFuncs.unit(cols[index].minWidth - 1),
						width: custFuncs.unit(cols[index].width - 1)
					});
					cols[index].lastValue = 1;
				}else{
					setStyle(item, {
                        minWidth: custFuncs.unit(cols[index].minWidth),
						width: custFuncs.unit(cols[index].width)
					});
					cols[index].lastValue = 0;
				}
				cols[index].self = item;
				dataset.set(item, "index", index);
			});

			custFuncs.initChild(listNodes, cols, true);

			each(totalList, function (item, index) {
				opts.groupInfo[index] = custFuncs.setParentData(item.parentNode);
			});

			className.add(opra.first(nodeList.gridHeader), "first");
			each(list, function (item) {
				var r = parseInt(dataset.get(item, "rows"));
				if (r > 1) {
					setStyle(item, {
						height: custFuncs.unit(r * parseInt(opts.titleHeight)),
						lineHeight: custFuncs.unit(r * parseInt(opts.titleHeight))
					});
				}
			});
		},
		getInitStatus: function () {
			if (nodeList !== null) return true;
			return false;
		},
		getSumTotal: function(){
            var selectType = (opts.selectType === "checkbox" || opts.selectType === "radio") && opts.selectStatus === "show";
            var order = (opts.order === true);
            var len = 0;
            selectType && (len += 42);
            order && (len += 42);
            return {len: len, selectType : selectType, order: order};
		},
		initGrid: function () {
			var sumTotal = custFuncs.getSumTotal();
			var list = opra.childNodes(nodeList.items);
            sumTotal.selectType && list.splice(0, 1);
            sumTotal.order && list.splice(0, 1);
            var cols = opts.columns,
				cache_cols = config.cache.data.columns,
                len = 0,
                pos = getPosition(node),
                body = {top: 0},
                top = closest(node, ".m-dialog-common");

			var screen_h = top ? node.parentNode.offsetHeight : document.body.clientHeight;
			if (node.style.height) {
				screen_h = parseInt(node.style.height);
				pos = {top: 0};
			} else if (top) {
				body = getPosition(node.parentNode);
			}

			var load = document.getElementById("proxy-loading");
			load && document.body.removeChild(load);
            dataset.set(nodeList.gridCont, "auto", opts.width === "100%");
			each(list, function (item, index) {
				if (cols[index].width) {
					setStyle(item, {
						width: custFuncs.unit(cols[index].width)
					});
				}
			});
			var count = list.length;
			each(list, function (item, index) {
				var w = item.offsetWidth;
				if(index === count - 1) w += 1;
				w = Math.max(w, cols[index].minWidth);
                len += w;
				cols[index].width = w;
				cols[index].self = item;
                cache_cols[index].initWidth = w;
				setStyle(item, {
					width: custFuncs.unit(w)
				});
			});
			len += sumTotal.len;
			var totalRows = opts.totalCols[0].rows;
			var style = {
				height: custFuncs.unit(opts.height || (screen_h - (pos.top - body.top) - (top ? 5 : 11) - 46 * totalRows) - (opts.show ? 54 : 0)),
				overflow: "auto"
			};

			if (opts.height === null) style.minHeight = "120px";
			else if (opts.minHeight !== null) style.minHeight = custFuncs.unit(opts.minHeight);

			if (opts.maxHeight !== null) style.maxHeight = custFuncs.unit(opts.maxHeight);
			var maxWidth = node.offsetWidth;

			setStyle(nodeList.gridCont, style);
			setStyle(node, {
				width: custFuncs.unit(maxWidth)
			});
			setStyle(nodeList.gridTitle, {
				width: custFuncs.unit(Math.min(maxWidth, len))
			});

			opts.width = len;
			opts.parent_width = maxWidth;
			nodeList.gridTitle.removeChild(nodeList.title);
			custFuncs.initGroup();
			custFuncs.setPage();
		},
		isArray: function (arr) {
			if (arr && getType(arr) === "array" && arr.length > 0) {
				return true;
			}
			return false;
		},
		getRandomName: function(){
			return "GRID_" + base.getUniqueId();
		},
		getRows: function (arr) {
			var list = [];
			each(arr, function (item) {
				var rows = 1;
				if (custFuncs.isArray(item.group)) {
					rows += custFuncs.getRows(item.group);
				}
				list.push(rows);
			});
			return Math.max.apply(null, list);
		},
		initData: function (columns) {
			var rows = [1],
				arr = [];
			each(columns, function (item) {
				arr.push(item);
				if (custFuncs.isArray(item.group)) {
					rows.push(custFuncs.getRows(item.group) + 1);
					custFuncs.initData(item.group);
				} else {
					if(!item.name) item.name = custFuncs.getRandomName();
					if(getType(item.sort) === "string") item.sort = true;
					item.minWidth = 42 + (opts.autoCal ? 25 : 0) + (item.sort ? 25 : 0) + (getType(item.tips) === "string" ? 25 : 0);
                    opts.fieldMap[item.name] = {index: opts.columns.length};
                    opts.columns.push(item);
				}
			});
			var max = Math.max.apply(null, rows);
			each(arr, function (item) {
				item.rows = max;
			});
		},
		setTopRows: function(columns){
			each(columns, function (item) {
				var rows = 1;
				if (custFuncs.isArray(item.group)) {
					rows += custFuncs.getRows(item.group);
					custFuncs.setTopRows(item.group);
				}
				if(item.rows !== rows){
					item.topRows = item.rows - rows + 1;
				}
			});
		},
		autoWidth: function(name, index) {
			try{
                var obj = {};
                var node = document.createElement("DIV");
                node.style.cssText = "position: fixed; top: -10000px; left: -10000px; width: 100%;font-size: " + custFuncs.media(13, 14) + "px;";
                document.body.appendChild(node);
                var span = document.createElement("span");
                node.appendChild(span);
                var texts = null;
                var bool = getType(name) === "string";
                var anyBool = config.cache.data.back.bool;
                if(bool){
                    texts = sizzle(".text[data-field="+ name +"],.drop-down[data-field="+ name +"]", nodeList.table);
				}else{
                    texts = [].slice.call(nodeList.table.querySelectorAll(".text,.drop-down"));
				}
                if(!texts || texts.length === 0) return;
                each(texts, function(item){
                    var field = dataset.get(item, "field");
                    if(!bool && config.cache.data.back.list.indexOf(field) === -1) return;
                    if(!obj[field]){
                        obj[field] = {arr: [], href: false};
                    }
                    var str = item.innerHTML;
                    if(/<input/.test(str)){
                        obj[field].arr.push(80);
					}else{
                        var match = str.match(/\<\/a\>/g);
                        if(match && !obj[field].href){
                            obj[field].href = true;
                        }
                        span.innerHTML = str;
                        var w = span.offsetWidth + (match ? match.length * 8 : 0);
                        obj[field].arr.push(w);
					}
                });

                var totalWidth = bool ? opts.width : 0;
                if(!bool && anyBool) totalWidth = config.cache.data.width;
                var filter = function(name){
                    var result = obj[name];
                    if(!result) return null;
                    var arr = result.arr;
                    var max = Math.max.apply(null, arr);
                    var width = 0;
                    if(result.href){
                        width = max + 22;
                    }else if(max < 280 || bool || anyBool){
                        width = max + 40;
                    }else{
                        var sum = 0;
                        each(arr, function(w){
                            sum += w;
                        });
                        width = Math.max(Math.round(max / 2), Math.round(sum / arr.length) + 40);
                    }
                    return width;
				};
                if(bool){
                	var col = config.cache.data.columns[index];
                    var width = filter(name);
                    totalWidth -= opts.columns[index].width;
                    col.width = Math.max(col.minWidth, width);
                    totalWidth += col.width;
				}else{
                    each(config.cache.data.columns, function(v){
                        var width = filter(v.name);
                        if(width === null) return;
                        if(anyBool) totalWidth -= v.width;
                        v.width = Math.max(v.minWidth, width);
                        totalWidth += v.width;
                    });
                    if(!anyBool){
                        var sumTotal = custFuncs.getSumTotal();
                        totalWidth += sumTotal.len;
					}
				}

                config.cache.data.width = totalWidth;
                document.body.removeChild(node);
                custFuncs.initView();
			}catch(e){
				console.log("auto-width-error",e);
			}
		},
		initProperty: function () {
            opts = custFuncs.clone(opts, false, true);
			opts.totalCols = opts.columns;
			opts.columns = [];
			opts.fieldMap = {};
			opts.fn = {
				formatDate: formatDate,
				formatOption: custFuncs.formatOption,
				getAttr: custFuncs.getAttr,
				getType: getType,
				unit: custFuncs.unit
			};
			if (getType(opts.dataGroup) === "object" && opts.dataGroup.name) {
				config.groupName = opts.dataGroup.name;
			} else {
				config.groupName = "group";
			}
			if (getType(opts.cache) === "object" && opts.cache.field) {
				opts.cache.map = {};
			} else {
				opts.cache = {};
			}

            opts.titleHeight = custFuncs.media(32, config.cache.data.titleHeight);
            opts.rowHeight = custFuncs.media(32, config.cache.data.rowHeight);

			if(opts.width === "100%"){
				var arr = [];
				var max = 0;
				var width = node.offsetWidth;
				each(opts.totalCols, function(item){
					if(getType(item.width) !== "undefined"){
						if(item.width.toString().indexOf("%") > -1){
							max += parseFloat(item.width) * width / 100;
						}else{
							max += parseFloat(item.width);
						}
						arr.push(item.width);
					}
				});
				var w = (opts.totalCols.length - arr.length) * 150;
				if(w + max > width){
                    var sumTotal = custFuncs.getSumTotal();
					opts.width = w + max + sumTotal.len;
					// if(closest(node, ".m-dialog-common")){
					// 	evtFuncs.toggleWidth();
					// }
				}
			}
		},
		dataBackups: function(type){
			if(type === 1){
                config.cache.data.initOptions = custFuncs.clone(opts, false, true);
                config.cache.data.titleHeight = opts.titleHeight;
                config.cache.data.rowHeight = opts.rowHeight;
                config.cache.data.disabled = opts.disabled;
			}else if(type === 2){
                config.cache.data.columns = custFuncs.clone(opts.columns, false, true);
                config.cache.data.width = opts.width;
			}
		}
	}

	//-------------一切从这开始--------------
	var init = function (_data) {
		data = _data;
		custFuncs.dataBackups(1);
		custFuncs.initProperty();
		custFuncs.initData(opts.totalCols);
		custFuncs.setTopRows(opts.totalCols);
        custFuncs.dataBackups(2);
		node.innerHTML = gridRender(opts);
		// 找到所有带有node-name的节点
		nodeList = parseModule(node);
		// 子模块实例化
		initMod();
		// 绑定事件
		bindEvents();
		custFuncs.initGrid();
	}

	//---------------暴露API----------------
	that.init = init;
	that.addRows = custFuncs.addRowsData;
	that.insertRows = custFuncs.insertRows;
	that.replaceRow = custFuncs.replaceRow;
	that.mergeRow = custFuncs.mergeRow;
	that.replaceSelectRows = custFuncs.replaceSelectRows;
	that.mergeSelectRows = custFuncs.mergeSelectRows;
	that.getSelectData = custFuncs.getSelectData;
	that.getSelectConvertData = custFuncs.getSelectConvertData;
	that.getAllData = custFuncs.getAllData;
	that.updatePage = custFuncs.updatePage;
	that.removeSelected = custFuncs.remove; //删除选中的数据
	that.removeByNode = custFuncs.removeByNode; //根据Node进行删除
	that.removeRows = custFuncs.removeRows;
	that.edit = custFuncs.editItemData;
	that.editToggle = custFuncs.editItemData;
	that.editSelectToggle = custFuncs.editSelectToggle;
	that.setStatusList = custFuncs.setStatusList;
	that.getStatusList = custFuncs.getStatusList;
	that.pageToggle = custFuncs.pageToggle;
	that.getChangeData = custFuncs.getChangeData;
	that.getSelectChangeData = custFuncs.getSelectChangeData;
	that.updateSelectData = custFuncs.updateSelectData;
	that.reload = custFuncs.reload;
	that.moveUp = custFuncs.moveUp;
	that.moveDown = custFuncs.moveDown;
	that.selectRows = custFuncs.checked;
	that.unSelectRows = custFuncs.unChecked;
	that.editToggleRow = custFuncs.editToggleRow;
	that.getPointNodes = custFuncs.getPointNodes;
	that.getSelectNodes = custFuncs.getSelectNodes;
	that.getInitStatus = custFuncs.getInitStatus;
	that.setOptions = custFuncs.setOptions;
	that.setPageOffset = custFuncs.setPageOffset;
	that.preventPage = custFuncs.preventPage;
	that.restorePage = custFuncs.restorePage;

	return that;
};