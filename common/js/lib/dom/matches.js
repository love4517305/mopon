/**
 * 判断当前节点是否匹配查询规则
 */
var sizzle = require("./sizzle");
var index = require("./index");

module.exports = function(node, selector) {
    if (node.nodeType != 1) {
        return false;
    }

    var p = HTMLElement.prototype;
    var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
        return index(this, sizzle(s)) != -1;
    }

    return f.call(node, selector);
}