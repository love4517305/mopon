/**
 * 检查字符串是否为空
 *
 * var isEmpty = require("../str/isEmpty");
 * console.log(isEmpty(null)); // true
 * console.log(isEmpty(" ")); // true
 *
 */

var trim = require("../str/trim");

module.exports = function(str) {
    return trim(str).length == 0;
}
