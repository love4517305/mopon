/**
 * 表单数据验证
 * 支持规则：部分可以并列存在，比如Mobile: true, Email: true，只要符合一项就通过
 * name: {
     * Required:true|{Val: true, Text: "自定义"},//是否必选，如果值为对象，val默认不填为true,text为必填自定义信息
     * Mobile: true|{Val: true, Text: "自定义"}//是否为手机号,可以并列
     * Phone: true|{Val: true, Text: "自定义"}//是否为座机号,可以并列
     * Email: true|{Val: true, Text: "自定义"}//是否为邮箱,可以并列
     * Length: 6|{Val: 6, Text: "自定义"}//输入字数或数组长度，其中val必填
     * MaxLength: 6|{Val: 6, Text: "自定义"}//输入最大字数或数组长度，其中val必填
     * MinLength: 6|{Val: 6, Text: "自定义"}//输入最小字数或数组长度，其中val必填
     * Code: true|{Val: true, Text: "自定义"}//是否为邮编,可以并列
     * Boolean: true|{Val: true, Text: "自定义"}//是否为布尔类型,可以并列
     * Array: true|{Val: true, Text: "自定义"}//是否为数据,可以并列
     * Function: true|{Val: true, Text: "自定义"}//是否为函数,可以并列
     * Object: true|{Val: true, Text: "自定义"}//是否为对象,可以并列
     * String: true|{Val: true, Text: "自定义"}//是否为字符串,可以并列
     * Number: true|{Val: true, Text: "自定义"}//是否为整数,可以并列
     * Max: 6|{Val: 6, Text: "自定义"}//如果是数字，不能大于6
     * Min: 6|{Val: 6, Text: "自定义"}//如果是数字，不能小于6
     * Double: true|{Val: true, Text: "自定义"}//是否为整数或小数,可以并列
     * Radix: 2|{Val: 2, Text: "自定义"}//当为小数时，保留几位小数
     * Url: true|{Val: true, Text: "自定义"}//是否为网址,可以并列
     * Chinese: true|{Val: true, Text: "自定义"}//是否为中文,可以并列
     * Reg: /^\d+$/|{Val: /^\d+$/, Text: "自定义"}//自定义正则验证,可以并列
     * Chars: true//是否按字符来计算长度
     * Val: '$name'|{Val: '$name', Text: "自定义"}//验证值是否和name的一致，以$开头，紧接着属性名称
     * Text: "姓名"默认属性名
 * }
 *_filter: function(key, value){}//验证过滤，return true则过滤
 * 使用：
 * var verify = require("plugin/module/verify");
 * var m_verify = verify();
 * m_verify.bind("verify", function(){});
 * m_verify.add({name: {Required: true, Text: "姓名"}, mobile: {Mobile: true, Text: "手机号"}});
 * m_verify.run({name: "璩", mobile: "1451444aa"});
 */

module.exports = function(name, val) {
    var base = require("lib/comp/base"); // 基础对象
    var dataType = require("lib/util/dataType");
    var merge = require("lib/json/merge");
    var clone = require("lib/json/clone");
    var regular = require("./regular");
    var each = require("lib/util/each");
    var filter = require("plugin/util/filterData");

    var ruleArray = ["Required", "Mobile", "Phone", "Email", "Length", "MaxLength", "MinLength", "Code", "Boolean", "Array", "Function", "Object", "String", "Number", "Max", "Min", "Double", "Radix", "Url", "Chinese", "Reg", "Chars", "Val", "Text"];
    var map = {};
    var that = base();

    var classUtil = {
        getText (obj, text){
            return dataType.isObject(obj) ? obj.Text : text;
        },
        format (val, bool){
            if(bool) return dataType.isUndefined(val) ? true: val;
            return val;
        },
        getVal (obj, bool){
            return dataType.isObject(obj) ? this.format(obj.Val, bool) : obj;
        },
        sNull (v){
            return dataType.isUndefined(v) || v === null ? "" : v;
        },
        isEntity (v) {
            if(dataType.isArray(v) && v.length === 0) return false;
            else if(dataType.isObject(v)){
                var suc = false;
                for(var k in v){
                    if(Object.hasOwnProperty(k)){
                        suc = true;
                        break;
                    }
                }
                return suc;
            }
            return true;
        },
        isTrue (obj, value){
            var result = false;
            if(this.getVal(obj, true)) result = true;
            return result && this.sNull(value) !== "";
        },
        getStrLen (s, bool) {
            if(!bool) return s.length;
            var l = 0;
            each(s.split(""), function(item){
                if (item.charCodeAt(0) < 299) {
                    l++;
                } else {
                    l += 2;
                }
            });
            return l;
        },
        removeLength (validate) {
            delete validate.MinLength;
            delete validate.MaxLength;
            delete validate.Length;
            delete validate.Min;
            delete validate.Max;
        },
        verify (validate, value, defaults){
            var result = {
                statusText: "",
                isVerifySuccess: true
            };
            if (this.getVal(validate.Required, true) && (this.sNull(value) === "" || !this.isEntity(value)) && !defaults) {
                result.statusText = this.getText(validate.Required, validate.Text + "不能为空！");
                result.isVerifySuccess = false;
                return result;
            }
            var reg = this.getVal(validate.Reg);
            if (reg && this.sNull(value) !== "") {
                if (!reg.test(value)) {
                    result.statusText = this.getText(validate.Reg, validate.Text + "格式不正确！");
                    result.isVerifySuccess = false;
                    delete validate.Reg;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            var length = this.getVal(validate.Length);
            if (regular.number(length) && this.sNull(value) !== "") { //验证长度
                if (dataType.isArray(value) && value.length !== length){
                    result.statusText = this.getText(validate.Length, validate.Text + "长度不符合！");
                    result.isVerifySuccess = false;
                    return result;
                }else if ((dataType.isString(value) || dataType.isNumber(value)) && this.getStrLen(value, validate.Chars) !== length) {
                    result.statusText = this.getText(validate.Length, validate.Text + "长度不符合！");
                    result.isVerifySuccess = false;
                    return result;
                }
                defaults = null;
            }
            var minLength = this.getVal(validate.MinLength);
            if (regular.number(minLength) && this.sNull(value) !== "") { //不能小于几位
                if (dataType.isArray(value) && value.length < minLength){
                    result.statusText = this.getText(validate.MinLength, validate.Text + "最小长度为" + minLength + "！");
                    result.isVerifySuccess = false;
                    return result;
                }else if ((dataType.isString(value) || dataType.isNumber(value)) && this.getStrLen(value, validate.Chars) < minLength) {
                    result.statusText = this.getText(validate.MinLength, validate.Text + "不能小于" + minLength + "个字符！");
                    result.isVerifySuccess = false;
                    return result;
                }
                defaults = null;
            }
            var maxLength = this.getVal(validate.MaxLength);
            if (regular.number(maxLength) && this.sNull(value) !== "") { //不能大于几位
                if (dataType.isArray(value) && value.length > minLength){
                    result.statusText = this.getText(validate.MaxLength, validate.Text + "最大长度为" + maxLength + "！");
                    result.isVerifySuccess = false;
                    return result;
                }else if ((dataType.isString(value) || dataType.isNumber(value)) && this.getStrLen(value, validate.Chars) > maxLength) {
                    result.statusText = this.getText(validate.MaxLength, validate.Text + "不能大于" + validate.MaxLength + "个字符！");
                    result.isVerifySuccess = false;
                    return result;
                }
                defaults = null;
            }
            if (this.isTrue(validate.Email, value)) { //邮箱验证
                if (!regular.email(value)) {
                    result.statusText = this.getText(validate.Email, validate.Text + "格式不正确！");
                    result.isVerifySuccess = false;
                    delete validate.Email;
                    this.removeLength(validate);
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Phone, value)) { //电话验证
                if (!regular.phone(value)) {
                    result.statusText = this.getText(validate.Phone, validate.Text + "格式不正确！");
                    result.isVerifySuccess = false;
                    delete validate.Phone;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Mobile, value)) { //手机验证
                if (!regular.mobile(value)) {
                    result.statusText = this.getText(validate.Mobile, validate.Text + "格式不正确！");
                    result.isVerifySuccess = false;
                    delete validate.Mobile;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Code, value)) { //邮政编码验证
                if (!regular.code(value)) {
                    result.statusText = this.getText(validate.Code, validate.Text + "格式不正确！");
                    result.isVerifySuccess = false;
                    delete validate.Code;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Boolean, value)) { //布尔类型验证
                if (!dataType.isBoolean(value)) {
                    result.statusText = this.getText(validate.Boolean, validate.Text + "非布尔类型！");
                    result.isVerifySuccess = false;
                    delete validate.Boolean;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Function, value)) { //函数验证
                if (!dataType.isFunction(value)) {
                    result.statusText = this.getText(validate.Function, validate.Text + "非函数！");
                    result.isVerifySuccess = false;
                    delete validate.Function;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Array, value)) { //数组类型验证
                if (!dataType.isArray(value)) {
                    result.statusText = this.getText(validate.Array, validate.Text + "非数组类型！");
                    result.isVerifySuccess = false;
                    delete validate.Array;
                    this.removeLength(validate);
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Object, value)) { //对象类型验证
                if (!dataType.isObject(value)) {
                    result.statusText = this.getText(validate.Object, validate.Text + "非对象类型！");
                    result.isVerifySuccess = false;
                    delete validate.Object;
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.String, value)) { //字符串类型验证
                if (!dataType.isString(value)) {
                    result.statusText = this.getText(validate.String, validate.Text + "非字符串类型！");
                    result.isVerifySuccess = false;
                    delete validate.String;
                    this.removeLength(validate);
                    return verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Double, value)) { //只能输入数字或者小数
                if(!regular.double(value)){
                    result.statusText = this.getText(validate.Double, validate.Text + "只能是小数或整数！");
                    result.isVerifySuccess = false;
                    delete validate.Double;
                    this.removeLength(validate);
                    return this.verify(validate, value, result);
                }
                defaults = null;
            } else if (this.isTrue(validate.Number, value)) { //只能输入数字
                if(!regular.number(value)){
                    result.statusText = this.getText(validate.Number, validate.Text + "只能是整数！");
                    result.isVerifySuccess = false;
                    delete validate.Number;
                    this.removeLength(validate);
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            var radix = this.getVal(validate.Radix);
            if (radix && /^(-?\d+)\.\d+$/.test(value)) {
                var len = value.match(/\.\d+/)[0].length - 1;
                if (len > parseInt(radix)) {
                    result.statusText = this.getText(validate.Number, validate.Text + "请保留" + radix + "位小数！");
                    result.isVerifySuccess = false;
                    return result;
                }
                defaults = null;
            }
            var min = this.getVal(validate.Min);
            if (regular.double(validate.Min) && regular.double(value)) {
                if (parseFloat(value) < parseFloat(min)) {
                    result.statusText = this.getText(validate.Min, validate.Text + "不能小于" + min + "！");
                    result.isVerifySuccess = false;
                    return result;
                }
                defaults = null;
            }
            var max = this.getVal(validate.Max);
            if (regular.double(validate.Max) && regular.double(value)) {
                if (parseFloat(value) > parseFloat(max)) {
                    result.statusText = this.getText(validate.Max, validate.Text + "不能大于" + max + "！");
                    result.isVerifySuccess = false;
                    return result;
                }
                defaults = null;
            }
            if (this.isTrue(validate.Url, value)) { //验证网址
                if (!regular.url(value)) {
                    result.statusText = this.getText(validate.Url, validate.Text + "格式不正确！");
                    result.isVerifySuccess = false;
                    delete validate.Url;
                    this.removeLength(validate);
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            if (this.isTrue(validate.Chinese, value)) { //验证中文
                if (!regular.chinese(value)) {
                    result.statusText = this.getText(validate.Chinese, validate.Text + "含有非中文！");
                    result.isVerifySuccess = false;
                    delete validate.Chinese;
                    this.removeLength(validate);
                    return this.verify(validate, value, result);
                }
                defaults = null;
            }
            var val = this.getVal(validate.Val);
            if(!dataType.isUndefined(val) && !defaults){
                if(val !== value){
                    result.statusText = this.getText(validate.Val, "两次" + validate.Pointer + "输入不一致！");
                    result.isVerifySuccess = false;
                    return result;
                }
            }
            return defaults || result;
        },
        isVerifyObject (obj){
            var bool = false;
            each(ruleArray, function(item){
                if(!bool && obj[item]){
                    bool = true;
                    return false;
                }
            });
            return bool;
        },
        formatFilterName (result, name, val, bool){
            if(dataType.isObject(val)){
                if(this.isVerifyObject(val)){
                    result[name] = val;
                }else{
                    each(val, function(v, k){
                        classUtil.formatFilterName(result, name + "." + k, v, bool);
                    });
                }
            }else if(bool === true && dataType.isArray(val)){
                result[name] = val;
            }else if(/^_/.test(name) && dataType.isFunction(val)){
                result[name] = val;
            }
        },
        getVerifyData (obj, bool){
            var result = {};
            each(obj, function(v, k){
                classUtil.formatFilterName(result, k, v, bool);
            });
            return result;
        },
        removeMap (name, val){
            if(dataType.isString(name)){
                if(!dataType.isUndefined(val)){
                    let r = map[name];
                    if(!dataType.isObject(r)) return;
                    if(dataType.isObject(val)){
                        each(val, function(v, k){
                            delete r[k];
                        });
                    }else if(dataType.isArray(val)){
                        each(val, function(item){
                            delete r[item];
                        });
                    }else if(dataType.isString(val)){
                        delete r[val];
                    }
                }else{
                    var arr = name.split(".");
                    var len = arr.length;
                    if(len > 1 && ruleArray.indexOf(arr[len - 1]) > -1){
                        var rule = arr[len - 1];
                        arr.splice(len - 1, 1);
                        var k = arr.join(".");
                        if(dataType.isObject(map[k])){
                            delete map[k][rule];
                        }
                    }else{
                        delete map[name];
                    }
                }
            }
        }
    };

    that.run = function(obj){
        var _filter = map._filter || function(){};
        var suc = true;
        each(map, function(v, name){
            var validate = map[name];
            if(!/^_/.test(name)){
                var value = filter(obj, name);
                if(_filter(name, value)) return;
                var valid = Object.assign({}, validate);
                if(/^\$([\s\S]+?)$/.test(classUtil.getVal(valid.Val))){
                    var val = RegExp.$1;
                    if(dataType.isObject(valid.Val)){
                        valid.Val.Val = filter(obj, val);
                    }else{
                        valid.Val = filter(obj, val);
                    }
                    valid.Pointer = map[val].Text;
                }
                var result = classUtil.verify(valid, value);
                if(!result.isVerifySuccess){
                    suc = false;
                    that.fire("verify", {
                        yes: result.isVerifySuccess,
                        name: name,
                        value: value,
                        result: obj,
                        statusText: result.statusText
                    });
                    return false;
                }
            }
        });
        if(suc){
            that.fire("verify", {
                yes: true,
                result: obj,
                statusText: ""
            });
        }
        return this;
    };

    that.add = function (name, obj) {
        if(dataType.isObject(name)){
            map = merge(true, map, classUtil.getVerifyData(name));
        }else if(dataType.isObject(obj)){
            var nObj = {};
            nObj[name] = obj;
            map = merge(true, map, classUtil.getVerifyData(nObj));
        }
        return this;
    };

    that.remove = function(name, obj){
        if(dataType.isObject(name)){
            each(classUtil.getVerifyData(name, true), function(v, k){
                classUtil.removeMap(k, v);
            });
        }else if(dataType.isArray(name)){
            each(name, function(item){
                classUtil.removeMap(item);
            });
        }else if(dataType.isObject(obj)){
            var nObj = {};
            nObj[name] = obj;
            each(classUtil.getVerifyData(nObj, true), function(v, k){
                classUtil.removeMap(k, v);
            });
        }else if(dataType.isFunction(name)){
            each(clone(map), function(v, k){
                var r = name(k, v);
                if(r === true){
                    delete map[name];
                }else if(dataType.isArray(r) || dataType.isObject(r)){
                    classUtil.removeMap(name, r);
                }
            });
        }else{
            classUtil.removeMap(name, obj);
        }

        return this;
    };

    that.add(name, val);

    return that;
};