var sizzle = require("./sizzle");

module.exports = function(node, onlyChild) {
    var list = Array.prototype.slice.call(sizzle((onlyChild === true ? "> " : "") + "[node-name]", node), 0);
    var nodeList = {};

    list.forEach(function(el) {
        var name = el.getAttribute("node-name");

        if (name in nodeList) {
            nodeList[name] = [].concat(nodeList[name], el);
        } else {
            nodeList[name] = el;
        }
    });

    return nodeList;
}