/***********
 * 数据类型
 * @type {obj}
 */
var getType = require('lib/util/getType');
var getNode = require('lib/dom/isNode');

module.exports = {
    isNumber: function(obj) {
        return getType(obj) === "number";
    },
    isString: function(obj) {
        return getType(obj) === "string";
    },
    isArray: function(obj) {
        return getType(obj) === "array";
    },
    isObject: function(obj) {
        return getType(obj) === "object";
    },
    isBoolean: function(obj) {
        return getType(obj) === "boolean";
    },
    isFunction: function(obj) {
        return getType(obj) === "function";
    },
    isNull: function(obj) {
        return getType(obj) === "null";
    },
    isUndefined: function(obj) {
        return getType(obj) === "undefined";
    },
    isNode: function(obj) {
        return getNode(obj);
    }
};