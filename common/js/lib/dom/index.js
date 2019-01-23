/**
 * 获取节点在父节点中的位置（仅限于element）
 */
var isElement = require("./isElement");

module.exports = function(element, nodeList) {
    var at = 0;
    var childNodes = nodeList || element.parentNode.childNodes;

    for (var i = 0; i < childNodes.length; i++) {
        if (element == childNodes[i]) {
            return at;
        }

        if (isElement(childNodes[i])) {
            at++;
        }
    }

    return -1;
}