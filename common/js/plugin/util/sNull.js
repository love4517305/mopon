/**
 * 去除字符为null或者undefined返回空字符或者默认字符
 */
define(function(require, exports, module) {
    //---------- require begin -------------
    var getType = require("lib/util/getType");
    //---------- require end -------------
    return function(v, d) {
        return typeof v == "undefined" || v == null ? ("undefined" == getType(d) ? "" : d) : ("number" == getType(v) ? (v + "") : v);
    }
});