/**
 * @author 璩
 * @data 2016-9-8
 * @description 树形节构
 */

module.exports = function (node, opts) {
	//----------------require--------------
	var base = require("lib/comp/base"); // 基础对象
	var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
	var each = require("lib/util/each");
	var getType = require("lib/util/getType");
	var merge = require("lib/json/merge");
	var render = require("plugin/tmpl/mTree.ejs");
	var renderItem = require("plugin/tmpl/mTreeItem.ejs");
	var opra = require("lib/dom/node");
	var className = require("lib/dom/className");
	var eventProxy = require("lib/evt/proxy");
	var animate = require("plugin/util/animate");
	var closest = require("lib/dom/closest");
	var sizzle = require("lib/dom/sizzle");
	var getPosition = require("lib/dom/getPosition");
	var insertHTML = require("lib/dom/insertHTML");
	var clone = require("lib/json/clone");
	var menu = require("plugin/module/contextMenu");

	//-----------声明模块全局变量-------------
	var nodeList = null; // 存储所有关键节点
	var that = base();
	var data = null;
	var map = {};
	var treeMap = [];
	var m_menu = null;

	var config = {
        relation: true,//是否相互关联
		data: [],
		filter: {
			key: "code",
			text: "text",
			child: "children",
			status: "open",
			type: "checkbox",
			event: "event",
			checked: "checked",
            highlight: "highlight"
		},
		title: {
			checkbox: true,
			text: "全选",
			event: "checkbox"
		},
		menuItem: null,
		tiled: false, //{child: "children", width: "200px"},平铺
		width: "auto",
		selectType: "checkbox",//默认多选
		autoInit: true,//是否自动初始化选中元素
		checkParents: false, //勾中父元素
		isFullCheck: false, //是否子集全选中才勾中父元素, 默认会有图标显示，但获取数据时，不会有当前数据返回
		initChild: false,//是否初始化子集的状态
		fn: {
			getType: getType
		}
	};
	opts = merge(true, config, opts || {});

	//-------------事件响应声明---------------
	var evtFuncs = {
		chooseCheckbox: function (evt) {
			var self = evt.target;
			if(self.disabled) return;
			var bool = self.checked;
			var unique = self.getAttribute("data-unique");
			var event = self.getAttribute("data-event");
			if(!opts.relation){
                that.fire(event, {
                    node: self,
                    checked: bool,
					id: unique,
                    all: Boolean(unique),
                    data: map[unique]
                });
				return;
			}
			if (unique) {
				if(className.has(self, "incomplete")){
                    className.remove(self, "incomplete");
					self.checked = true;
					bool = true;
				}
				custFuncs.chooseItems(unique, bool);
				var incomplete = !!nodeList.treeItems.querySelector(".incomplete");
				that.fire(event, {
					node: self,
					checked: bool,
					all: false,
					isAllChecked: bool && !incomplete,
					incomplete: incomplete,
                    childMap: custFuncs.getInitChild(),
					data: map[unique]
				});
			} else {
				var list = sizzle("input", nodeList.treeItems);
				each(list, function (item) {
					if(item.disabled) return;
					item.checked = bool;
				});
				that.fire(event, {
					checked: bool,
                    incomplete: false,
                    isAllChecked: bool,
					all: true
				});
			}
		},
		chooseRadio: function (evt) {
			var self = evt.target;
			var unique = self.getAttribute("data-unique");
			var event = self.getAttribute("data-event");
			that.fire(event, {
				node: self,
				data: map[unique]
			});
		},
		toggleItems: function (evt) {
			var self = evt.target;
			var folder = opra.next(self);
			if (className.has(self, "open")) {
				className.remove([self, folder], "open");
				custFuncs.operateFold(self.getAttribute("data-unique"), false);
			} else {
				className.add([self, folder], "open");
				custFuncs.operateFold(self.getAttribute("data-unique"), true);
			}
		},
		clickMenu: function(evt){
			that.fire("menu", evt.data);
		},
		clickItem: function(evt){
			var self = evt.target;
			if(className.has(self, "content") && self.nodeName.toLowerCase() === "label"){
				var unique = self.getAttribute("data-unique");
				that.fire("click", {id: unique, map: map[unique]});
			}
		}
	}

	//-------------子模块实例化---------------
	var initMod = function () {
		if(getType(opts.menuItem) === "array"){
			m_menu = menu(nodeList.treeItems, {
				action: "bindMenu",
				items: opts.menuItem
			});
			m_menu.init();
		}
	}

	//-------------绑定事件------------------
	var bindEvents = function () {
		var proxy = eventProxy(node);
		(opts.selectType === "checkbox") && proxy.add("checkbox", "click", evtFuncs.chooseCheckbox);
		(opts.selectType === "radio") && proxy.add("radio", "click", evtFuncs.chooseRadio);
		proxy.add("fold", "click", evtFuncs.toggleItems);
		proxy.add("bindMenu", "change", evtFuncs.clickItem);
		m_menu && m_menu.bind("click", evtFuncs.clickMenu);
	}

	//-------------自定义函数----------------
	var custFuncs = {
		cancelParentsChecked: function(node){
			var parents = closest(node.parentNode, ".child-items");
			if (parents) {
                var prev = opra.prev(parents);
                if(className.has(prev, "_parent")){
                    var input = sizzle("input", prev)[0];
                    if(custFuncs.childIsAllCheck(parents, false)){
                        input.checked = false;
                        className.remove(input, "incomplete");
                    }else{
                    	if(opts.isFullCheck) input.checked = false;
                        className.add(input, "incomplete");
                    }
                }
                var parentNode = parents.parentNode;
                if(parentNode){
                    custFuncs.cancelParentsChecked(parentNode);
                }
			}
		},
		childIsAllCheck: function(node, bool) {
            var isCheck = true;
            var cList = sizzle("input", node);
            each(cList, function (item) {
                if ((bool && !item.checked) || (!bool && item.checked)) {
                    isCheck = false;
                    return false;
                }
            });
            return isCheck;
		},
		chooseParent: function (node, bool, bool2) {
			try {
				if (!node) return;
                var isCheck = bool && !custFuncs.childIsAllCheck(node, true);
                var prev = opra.prev(node);
                var list = sizzle("input", prev);
                each(list, function (item) {
                	if(isCheck && opts.isFullCheck){
                        item.checked = false;
					}else item.checked = bool;
                    if(isCheck) className.add(item, "incomplete");
                    else className.remove(item, "incomplete");
                    if(bool2 === true) item.disabled = true;
                });
                var parent = node.parentNode;
                if (parent) {
                    custFuncs.chooseParent(closest(parent, ".child-items"), bool, bool2);
                }
			} catch (e) {
				//console.log(e);
			}
		},
        relationChooseItems: function(type, id, checked, disabled){
            var node = custFuncs.getNode(id);
			if(type === "parent"){
                if(!checked && nodeList.topCheckbox){
                    nodeList.topCheckbox.checked = false;
                }
                if (!checked && !opts.checkParents) {
                    custFuncs.chooseParent(closest(node, ".child-items"), checked, disabled);
                } else if (opts.checkParents) {
                    if (!checked) {
                        custFuncs.cancelParentsChecked(node);
                    } else {
                        custFuncs.chooseParent(closest(node, ".child-items"), true, disabled);
                    }
                }
			}else if(type === "child"){
                var parent = closest(node, "._parent");
                if (parent) {
                    var list = sizzle("input", opra.next(parent));
                    each(list, function (item) {
                        item.checked = checked;
                        if(disabled === true) item.disabled = true;
                        else if(disabled === false) item.disabled = false;
                    });
                }
			}
		},
		chooseItems: function (id, bool, bool2) {
			try {
				var node = custFuncs.getNode(id);
				var parent = closest(node, "._parent");
				if (parent) {
					var list = sizzle("input", opra.next(parent));
					each(list, function (item) {
						item.checked = bool;
                        className.remove(item, "incomplete");
						if(bool2 === true) item.disabled = true;
					});
				}
				if(!bool && nodeList.topCheckbox){
					nodeList.topCheckbox.checked = false;
				}
				if (!bool && !opts.checkParents) {
					custFuncs.chooseParent(closest(node, ".child-items"), bool, bool2);
				} else if (opts.checkParents) {
					if (!bool) {
						custFuncs.cancelParentsChecked(node);
					} else {
						custFuncs.chooseParent(closest(node, ".child-items"), true, bool2);
					}
				}
			} catch (e) {
				//console.log(e);
			}
		},
		operateFold: function (id, bool, fn) {
			try {
				var parent = closest(custFuncs.getNode(id), "._parent");
				if (!parent) return;
				var child = opra.next(parent);
				var h = child.scrollHeight;
				animate(300, function (p) {
					child.style.height = (bool ? p * h : (1 - p) * h) + "px";
					if (p === 1 && bool) {
						child.style.height = "auto";
					}
					if(p === 1){
                        (getType(fn) === "function") && fn();
						that.fire("toggle", {type: bool ? "open" : "close"});
					}
				}).start(true);
			} catch (e) {
				//console.log(e);
			}
		},
		setDisabled: function(bool, arr){
			var list = sizzle("input", nodeList.treeItems);
			var isArr = getType(arr) === "array";
			each(list, function (item) {
				if(isArr){
					var unique = item.getAttribute("data-unique");
					if(arr.indexOf(unique) > -1){
						item.disabled = bool;
					}
				}else{
					item.disabled = bool;
				}
			});
		},
        setOptions: function(opt) {
			if(getType(opt) === "object"){
                opts = merge(true, opts, opt);
			}
		},
		selectAll: function(){
			var list = sizzle("input", nodeList.treeItems);
			each(list, function (item) {
				item.checked = true;
			});
			that.fire(event, {
				checked: true,
				all: true
			});
		},
		selectTreeItems: function (arr, bool1, bool2) {//bool1是否关联子级或父级,bool2是否禁用
			each([].concat(arr), function (id) {
				var node = custFuncs.getNode(id);
				if (node) {
					node.checked = true;
					if(bool1 !== false) custFuncs.chooseItems(id, true, bool2);
					if(bool2 === true) node.disabled = true;
				}
			});
		},
		unSelectTreeItems: function (arr, bool) {
			each([].concat(arr), function (id) {
				var node = custFuncs.getNode(id);
				if (node) {
					node.checked = false;
					if(bool !== false) custFuncs.chooseItems(id, false);
				}
			});
		},
		getNode: function (id) {
			return document.getElementById("m_tree_unique_" + id);
		},
		recData: function(obj, node){
			var parent = closest(node, ".child-items");
			if(parent){
				var prev = opra.prev(parent);
				if(className.has(prev, "_parent")){
					var input = sizzle("input", prev)[0];
					if(input){
						var unique = input.getAttribute("data-unique");
						obj[unique] = true;
						custFuncs.recData(obj, prev);
					}
				}
			}
		},
		findParentData: function(obj){
			each(obj, function(v, k){
				var node = custFuncs.getNode(k);
				custFuncs.recData(obj, node);
			});
			return obj;
		},
		filterData: function(res, obj){
			var result = [];
			each(res, function(item){
				if(obj[item[opts.filter.key]]){
					if(item[opts.filter.child]){
						item[opts.filter.child] = custFuncs.filterData(item[opts.filter.child], obj);
					}
					if(getType(opts.tiled) === "object" && item[opts.tiled.child]){
						item[opts.tiled.child] = custFuncs.filterData(item[opts.tiled.child], obj);
					}
					result.push(item);
				}
			});
			return result;
		},
		getTreeSelectData: function (bool) {
			var treeData = clone(treeMap);
			var list = sizzle("input", nodeList.treeItems);
			var obj = {};
			each(list, function (item) {
				if (item.checked) {
					if(bool === false && item.disabled) return;
					var unique = item.getAttribute("data-unique");
					obj[unique] = true;
				}
			});
			return custFuncs.filterData(treeData, custFuncs.findParentData(obj));
		},
		getOuterSelectData: function(bool){
			return custFuncs.getSelectData(bool);
		},
		getSelectData: function (bool, node) {
			var list = sizzle("input", node || nodeList.treeItems);
			var result = [];
			each(list, function (item) {
				if (item.checked) {
					if(bool === false && item.disabled) return;
					var unique = item.getAttribute("data-unique");
					result.push(map[unique]);
				}
			});
			return result;
		},
		getUnSelectData: function (bool) {
			var list = sizzle("input", nodeList.treeItems);
			var result = [];
			each(list, function (item) {
				if (!item.checked) {
					if(bool === false && item.disabled) return;
					var unique = item.getAttribute("data-unique");
					result.push(map[unique]);
				}
			});
			return result;
		},
		getFoldId: function (node, unique, type) {
			var result = [];
			try {
				var parent = node.parentNode;
				if (!parent) return result;
				if (!className.has(parent, "tree-items")) {
					node = closest(parent, ".folder-item");
					if (!node) return result;
					result = result.concat(custFuncs.getFoldId(node, unique, type));
				} else {
					var list = sizzle(".fold", node);
					var bool = null;
					if(type === 1) bool = true;
					else if(type === 2) bool = false;
					var add = function(item, id){
                        var folder = opra.next(item);
                        className.add([item, folder], "open");
                        result.push(id);
					};
					each(list, function (item) {
						var id = item.getAttribute("data-unique");
                        if(type === 2 && id === unique){
                            bool = true;
                        }
						if (!className.has(item, "open")) {
							if(bool === null){
                                add(item, id);
							}else if(type === 1 && bool === true){
                                add(item, id);
                            }else if(type === 2 && bool === true){
                                add(item, id);
                            }
						}
                        if(type === 1 && id === unique){
                            bool = false;
                        }
					});
				}
			} catch (e) {
				//console.log(e);
			}
			return result;
		},
		resetName: function(name, node){
			var text = sizzle(".text", node)[0];
			if(text) {
				text.innerHTML = name;
			}
		},
		removeItem: function(node){
			var parent = node.parentNode;
			var unique = node.getAttribute("data-unique");
			parent.parentNode.removeChild(parent);
			return {id: unique};
		},
		location: function (id) {
			var cur = custFuncs.getNode(id);
			if (!cur) return;
			var list = custFuncs.getFoldId(cur);
			var len = list.length;
			var callback = function(){
                var curScrollTop = node.scrollTop;
                node.scrollTop = 0;
                var pos1 = getPosition(node);
                var pos2 = getPosition(cur.parentNode);
				var scrollTop = pos2.top - pos1.top;
                node.scrollTop = curScrollTop;
				if(curScrollTop > 0 && scrollTop === 0) return;
				var mod = scrollTop - curScrollTop;
				animate(300, function(p){
                    node.scrollTop = curScrollTop + mod * p;
				}).start(true);
			};
			if(len === 0){
				callback();
				return;
			}
			each(list, function (v, index) {
				custFuncs.operateFold(v, true, len === index + 1 ? callback : null);
			});
		},
		toggleFold: function(id, bool, type){
            var cur = custFuncs.getNode(id);
            if (!cur) return;
            var list = custFuncs.getFoldId(cur, id, type);
            each(list, function (v) {
                custFuncs.operateFold(v, bool);
            });
		},
		getTreeAllData: function () {
			return clone(treeMap);
		},
		getAllData: function () {
			var result = [];
			each(map, function (item) {
				result.push(item);
			});
			return result;
		},
		unit: function (v) {
			if (/^\d+$/.test(v)) {
				return v + "px";
			}
			return v;
		},
		insertTreeItems: function (res) {
			var data = opts.data;
			opts.data = [].concat(res);
			insertHTML(nodeList.treeItems, renderItem(opts), "afterbegin");
			opts.data = opts.data.concat(data);
			custFuncs.initData(opts.data, treeMap);
            opts.autoInit && custFuncs.initChooseItems(opts.checkParents);
            custFuncs.fireChild();
		},
		addTreeItems: function (res) {
			if (getType(res) === "array" && res.length > 0) {
				opts.data = res;
				node.innerHTML = render(opts);
				nodeList = merge(nodeList, parseModule(node));
				custFuncs.initData(opts.data, treeMap);
                opts.autoInit && custFuncs.initChooseItems(opts.checkParents);
                custFuncs.fireChild();
			} else {
				opts.data = [];
				node.innerHTML.innerHTML = "";
			}
		},
		/******
		 * {selectType: "checkbox|radio|false", event: null, res: {id: "", text: ""}}
         */
		addOneItem: function(node, res, pos){
			if(className.has(node.parentNode, "content")){
				node = node.parentNode;
			}
			if(className.has(node, "_parent")){
				var next = opra.next(node);
				insertHTML(next, renderItem({data: res, fn: {getType: getType}}), pos == "before" ? "beforebegin" : pos == "after" ? "afterend" : "beforeend");
			}else{
				if(pos == "after" || pos == "before"){
					insertHTML(node.parentNode, renderItem({data: res, fn: {getType: getType}}), pos == "before" ? "beforebegin" : "afterend");
				}else{
					node.parentNode.className = "folder-item";
					var unique = node.getAttribute("data-unique");
					var code = '<i class="fold open" data-action="fold" data-unique="'+ unique +'"></i> <i class="folder open"></i>';
					className.add(node, "_parent");
					insertHTML(node, code, "beforebegin");
					insertHTML(node, '<ul class="child-items" style="height: auto;">' + renderItem({data: res, fn: {getType: getType}}) + '</ul>', "afterend");
				}
			}
		},
		addFile: function(node, res, pos){
			res.type = 2;
			custFuncs.addOneItem(node, res, pos);
		},
		addFolder: function(node, res, pos){
			res.type = 1;
			custFuncs.addOneItem(node, res, pos);
		},
		initData: function (res, tree) {
			each(res, function (item) {
				if (getType(item) === "object") {
					var obj1 = {}, obj2 = {};
					each(item, function (v, k) {
						if (getType(v) === "array" && k === opts.filter.child) {
							obj2[opts.filter.child] = [];
							custFuncs.initData(v, obj2[opts.filter.child]);
							return;
						}else if(getType(v) === "array" && getType(opts.tiled) === "object" && k === opts.tiled.child){
							obj2[opts.tiled.child] = [];
							custFuncs.initData(v, obj2[opts.tiled.child]);
							return;
						}
						obj1[k] = v;
						obj2[k] = v;
					});
					map[item[opts.filter.key]] = obj1;
					tree.push(obj2);
				}
			});
		},
		getInitChild: function() {
            let childMap = null;
            if(opts.selectType === "checkbox" && opts.initChild) {
                let list = opra.childNodes(nodeList.treeItems);
                if (list.length > 1) {
                    each(list, function (item) {
                        if (className.has(item, "folder-item")) {
                            if (childMap === null) childMap = {};
                            var unique = item.getAttribute("data-unique");
                            var items = custFuncs.getSelectData(null, item);
                            var bool = !!item.querySelector(".incomplete");
                            childMap[unique] = {
                                isAllChecked: items.length > 0 && !bool,
                                incomplete: bool
                            };
                        }
                    });
                }
            }
            return childMap;
		},
		initChooseItems: function(bool, isDisabled){
            var list = custFuncs.getSelectData();
            each(list, function(item){
                custFuncs.chooseItems(item[opts.filter.key], bool, isDisabled);
            });
		},
		fireChild () {
            if(opts.selectType === "checkbox"){
                var list = custFuncs.getSelectData();
                var bool = !!nodeList.treeItems.querySelector(".incomplete");
                that.fire("init", {
                    isAllChecked: list.length > 0 && !bool,
                    incomplete: bool,
                    childMap: custFuncs.getInitChild()
                });
            }
		}
	}

	//-------------一切从这开始--------------
	var init = function (_data) {
		data = _data;
		opts.fn.unit = custFuncs.unit;
		node.innerHTML = render(opts);
		// 找到所有带有node-name的节点
		nodeList = parseModule(node);
		// 子模块实例化
		initMod();
		// 绑定事件
		bindEvents();

		custFuncs.initData(opts.data, treeMap);
        opts.autoInit && custFuncs.initChooseItems(opts.checkParents);
        custFuncs.fireChild();
	}

	//---------------暴露API----------------
	that.init = init;
	that.selectTreeItems = custFuncs.selectTreeItems;
	that.unSelectTreeItems = custFuncs.unSelectTreeItems;
	that.selectAll = custFuncs.selectAll;
	that.getAllData = custFuncs.getAllData;
	that.getTreeAllData = custFuncs.getTreeAllData;
	that.getSelectData = custFuncs.getOuterSelectData;
	that.getUnSelectData = custFuncs.getUnSelectData;
	that.getTreeSelectData = custFuncs.getTreeSelectData;
	that.addTreeItems = custFuncs.addTreeItems;
	that.insertTreeItems = custFuncs.insertTreeItems;
	that.location = custFuncs.location;
	that.addFile = custFuncs.addFile;
	that.addFolder = custFuncs.addFolder;
	that.removeItem = custFuncs.removeItem;
	that.resetName = custFuncs.resetName;
	that.setDisabled = custFuncs.setDisabled;
	that.relationChooseItems = custFuncs.relationChooseItems;
	that.toggleFold = custFuncs.toggleFold;
	that.setOptions = custFuncs.setOptions;

	return that;
};