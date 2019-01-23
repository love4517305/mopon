/**
 * 封装了node.dataset功能, dataset是标准浏览器新增的功能，这里主要是为了兼容旧浏览器
 * <div id="node" data-node-value="123"></div>
 * var dataset = require("../dom/dataset");
 * dataset.get(node, "nodeValue")将会读取data-node-value，得到123
 * dataset.set(node, "nodeValue", "123")将会设置data-node-value为123
 * 注意传入的KEY是驼峰命名
 */

var that = {};

var keyCase = function(key) {
    return "data-" + key.replace(/([A-Z]|(?:^\d+))/g, function(all, match) {
        return "-" + match.toLowerCase();
    });
}

that.get = function(node, key) {
    return "dataset" in node ? node.dataset[key] : node.getAttribute(keyCase(key));
};

that.set = function(node, key, val) {
    if ("dataset" in node) {
        node.dataset[key] = val;
    } else {
        node.setAttribute(keyCase(key), val);
    }
}

that.remove = function(node, key) {
    if ("dataset" in node) {
        delete node.dataset[key];
    } else {
        node.removeAttribute(keyCase(key));
    }
}

module.exports = that;
