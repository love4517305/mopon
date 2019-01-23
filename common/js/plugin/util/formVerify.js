/**
表单验证
 **/

module.exports = function (node, opts) {
	//----------------require--------------

	var base = require("lib/comp/base"); // 基础对象
	var sizzle = require("lib/dom/sizzle");
	var queryToJson = require("lib/json/queryToJson");
	var merge = require("lib/json/merge");
	var getType = require("lib/util/getType");
	var trim = require("lib/str/trim");
	var each = require("lib/util/each");
    var addEvent = require('lib/evt/add');
	var reg = require("./regular");
	var formatDate = require("./formatDate");
	var formatFloatValue = require("./formatFloatValue");

	//-----------声明模块全局变量-------------
	var nodeList = null; // 存储所有关键节点
	var that = base();
	var data = null;
	var regular = reg();
	var defaults = {
		data: {},
		extraData: {}
	};
	opts = merge({
		attr: "data-validate",
		placeholder: true,
		serial: false,
		title: true,
		enter: false,//回车执行
		blocker: true,//默认过滤的时候数据进行拦截
		again: false //重新加载
	}, opts || {});
	//-------------事件响应声明---------------
	var evtFuncs = {
        enter: function(evt){
        	if(evt.keyCode == 13){
                custFuncs.verifyForm();
			}
		}
	}

	//-------------子模块实例化---------------
	var initMod = function () {
	}

	//-------------绑定事件------------------
	var bindEvents = function () {}

	//-------------自定义函数----------------
	var custFuncs = {
		include: function (str, v) {
			return (str + "").indexOf(v) > -1;
		},
		verifyForm: function () {
			var isVerifySuccess = true;
			var statusText = "";
			var list = [];
			var self = null;
			var result = {};
			if (opts.again) {
				nodeList = Array.prototype.slice.call(sizzle("[" + opts.attr + "]", node || document.body), 0);
			}
			nodeList.forEach(function (item) {
				var type = item.type;
				self = item;
				opts.blocker = true;
				var validate = queryToJson(item.getAttribute("data-validate"));
				if (custFuncs.include(type, "radio") || custFuncs.include(type, "checkbox")) {
					list.push(item);
					return;
				}
				var name = item.name;
				var value = trim(item.value);

				var filter = false;

				if (getType(opts.filter) == "function") {
					filter = (opts.filter(item, type, name) === false);
				}

				 if(value != "" && validate.number && regular.number(value)){
				 	value = custFuncs.removeZero(value);
				 	item.value = value;
				 }else if(value != "" && validate.double && regular.double(value)){
				 	value = custFuncs.removeZero(value);
				 	item.value = value;
				 }
				if(filter) {
					if(opts.blocker === false){
						if(validate.precision){
							custFuncs.delRepeat(result, name, formatFloatValue(value, parseInt(validate.precision)));
						}else{
							custFuncs.delRepeat(result, name, value);
						}
					}
					return;
				}
				if(validate.precision){
					custFuncs.delRepeat(result, name, formatFloatValue(value, parseInt(validate.precision)));
				}else{
					custFuncs.delRepeat(result, name, value);
				}
				if (validate.required && value == "") { //普通验证
					if (custFuncs.include(type, "select") || validate.select) {
						statusText = "请选择" + validate.nullText + "！";
					} else {
						statusText = validate.nullText + "不能为空！";
					}
					isVerifySuccess = false;
					return false;
				}
				if (validate.reg && value != "") {
					var reg = null;
					if(/^\/([\s\S]+?)(\/|\/[a-z]{1,2})$/.test(validate.reg)){
						var end = RegExp.$2;
						reg = new RegExp(RegExp.$1, end.length == 1 ? "" : end.substr(1));
					}else{
						reg = new RegExp(validate.reg);
					}
					if (!reg.test(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.minlength && value != "") { //不能小于几位
					if (custFuncs.getStringLen(value, validate.char) < validate.minlength) {
						statusText = validate.nullText + "不能小于" + validate.minlength + "个字符！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.maxlength && value != "") { //不能大于几位
					if (custFuncs.getStringLen(value, validate.char) > validate.maxlength) {
						statusText = validate.nullText + "不能大于" + validate.maxlength + "个字符！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.email && value != "") { //邮箱验证
					if (!regular.email(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.phone && value != "") { //电话验证
					if (!regular.phone(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.mobile && value != "") { //手机验证
					if (!regular.mobile(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.code && value != "") { //邮政编码验证
					if (!regular.code(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.idCard && value != "") { //身份证号码验证
					if (!regular.idCard(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
				if (validate.specialCharacter && value != "") { //特殊字符验证
					if (regular.regEn(value) || regular.regCn(value)) {
						statusText = validate.nullText + "不能包含特殊字符!";
						isVerifySuccess = false;
						return false;
					}
				}
				if ((validate.number || validate.double) && value != "") {
					if (!regular.double(value) && validate.double) { //只能输入数字或者小数
						statusText = validate.nullText + "只能是小数或整数！";
						isVerifySuccess = false;
						return false;
					} else if (!regular.number(value) && validate.number) { //只能输入数字
						statusText = validate.nullText + "只能是整数！";
						isVerifySuccess = false;
						return false;
					}
					if (validate.precision && validate.double && /^(-?\d+)\.\d+$/.test(value)) {
						var v = parseInt(validate.precision);
						var count = value.split(".")[1].length;
						if (count > v) {
							statusText = validate.nullText + "只能精确到" + v + "位小数！";
							isVerifySuccess = false;
							return false;
						}
					}
					if (!isNaN(validate.min)) {
						if (parseFloat(value) < parseFloat(validate.min)) {
							statusText = validate.nullText + "不能小于" + validate.min + "！";
							isVerifySuccess = false;
							return false;
						}
					}
					if (!isNaN(validate.max)) {
						if (parseFloat(value) > parseFloat(validate.max)) {
							statusText = validate.nullText + "不能大于" + validate.max + "！";
							isVerifySuccess = false;
							return false;
						}
					}
				}
				if (validate.url && value != "") { //验证网址
					if (!regular.url(value)) {
						statusText = validate.nullText + "格式不正确！";
						isVerifySuccess = false;
						return false;
					}
				}
			});

			var map = {
				radio: {},
				checkbox: {}
			};
			if (isVerifySuccess) {
				list.forEach(function (item) {
					var type = item.type;
					var validate = queryToJson(item.getAttribute("data-validate"));
					var name = item.name;
					var value = trim(item.value);

					if (getType(opts.filter) == "function") {
						if (!opts.filter(item, type, name)) {
							if(opts.blocker === false){
								if (item.checked && name) custFuncs.delRepeat(result, name, value);
							}
							return;
						}
					}

					if (item.checked && name) custFuncs.delRepeat(result, name, value);

					if (name) {
						if (map[type][name]) {
							var r = map[type][name];
							if (getType(r) == "array") {
								r.push(item);
								map[type][name] = r;
							} else {
								map[type][name] = [r, item];
							}
						} else {
							map[type][name] = item;
						}
					}
				});

				var checkbox = custFuncs.verifySelect(map.checkbox);
				if (!checkbox.isVerifySuccess) {
					isVerifySuccess = false;
					statusText = checkbox.statusText;
					self = checkbox.self;
				} else {
					var radio = custFuncs.verifySelect(map.radio);
					if (!radio.isVerifySuccess) {
						isVerifySuccess = false;
						statusText = radio.statusText;
						self = radio.self;
					}
				}
			}
			
			var obj = merge(data.data || {}, result);

			if(opts.serial){
				each(obj, function(item, key){
					if(getType(item) == "object" || getType(item) == "array"){
						obj[key] = JSON.stringify(item);
					}
				});
			}

			that.fire("verify", {
				self: isVerifySuccess ? null : self,
				yes: isVerifySuccess,
				result: obj,
				statusText: statusText,
				extraData: data.extraData
			});
		},
		verifySelect: function (obj) {
			var isVerifySuccess = true;
			var statusText = "";
			var self = null;
			each(obj, function (item) {
				var isCheck = true,
					loadText = "";
				if (getType(item) == "array") {
					item.forEach(function (item) {
						var validate = queryToJson(item.getAttribute("data-validate"));
						loadText = validate.nullText;
						self = item;
						if (item.checked || !validate.required) { //符合
							isCheck = false;
							return false;
						}
					});
				} else {
					var validate = queryToJson(item.getAttribute("data-validate"));
					loadText = validate.nullText;
					self = item;
					if (!validate.required || item.checked) { //符合
						isCheck = false;
						return false;
					}
				}
				if (isCheck && loadText != "") {
					isVerifySuccess = false;
					statusText = "请选择" + loadText + "！";
					return false;
				}
			});
			return {
				isVerifySuccess: isVerifySuccess,
				statusText: statusText,
				self: self
			};
		},
		delRepeat: function (obj, key, val) {
			if (key) {
				var arr = key.split(".");
				if (arr.length > 1) {
					var p = [obj];
					var len = arr.length;
					each(arr, function (item, index) {
						if (!p[p.length - 1][item]) {
							p[p.length - 1][item] = {};
						}
						p.push(p[p.length - 1][item]);
						if (index == len - 2) {
							custFuncs.setObjValue(p[p.length - 1], arr[len - 1], val);
							return false;
						}
					});
					p = null;
				} else {
					custFuncs.setObjValue(obj, key, val);
				}
			}
		},
		setObjValue: function (obj, key, val) {
			if (getType(obj[key]) != "undefined") {
				if (getType(obj[key]) == "array") {
					obj[key].push(val);
				} else {
					obj[key] = [obj[key]];
					obj[key].push(val);
				}
			} else {
				obj[key] = val;
			}
		},
		getStringLen: function (s, bool) {
			if(bool === 'false') return s.length;
			var l = 0;
			var a = s.split("");
			for (var i = 0; i < a.length; i++) {
				if (a[i].charCodeAt(0) < 299) {
					l++;
				} else {
					l += 2;
				}
			}
			return l;
		},
		initForm: function () {
			nodeList = Array.prototype.slice.call(sizzle("[" + opts.attr + "]", node || document.body), 0);
			nodeList.forEach(function (item) {
                var type = item.type;
				if(opts.enter && custFuncs.include(type, "text")){
					addEvent(item, "keyup", evtFuncs.enter);
				}
				var validate = queryToJson(item.getAttribute("data-validate"));
				if (validate.nullText) {
					opts.title && (item.title = (validate.select ? "请选择" : "请输入") + validate.nullText);
					opts.placeholder && (item.placeholder = (validate.select ? "请选择" : "请输入") + validate.nullText);
				}
				if (validate.dateFormat && trim(item.value) != "") {
					item.value = formatDate(trim(item.value), validate.dateFormat);
				}
			});
		},
		setBlocker: function(bool){
			if(getType(bool) == "boolean"){
				opts.blocker = bool;
			}
		},
		setFilter: function (fn) {
			if (getType(fn) == "function") {
				opts.filter = fn;
			}
		},
		removeZero: function(value){
			var reg =/^(-?)([0]+)(\d+\.?\d*)$/;
			if(reg.test(value)){
				return RegExp.$1 + RegExp.$3;
			}
			return value;
		}
	};

	//-------------一切从这开始--------------
	var init = function (_data) {
		data = merge(defaults, _data || {});
		// //console.log(data);
		// 子模块实例化
		initMod();
		// 绑定事件
		bindEvents();
		custFuncs.initForm();
	};

	//---------------暴露API----------------
	that.init = init;
	that.run = custFuncs.verifyForm;
	that.setFilter = custFuncs.setFilter;
	that.setBlocker = custFuncs.setBlocker;

	return that;
};