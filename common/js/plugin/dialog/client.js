/**
 * 弹层调用客户端，由iframe中的子页面调用
 * var client = require("plugin/dialog/client");
 * var dia = client({
 *     "layerId": "plugin/dialog/alert",
 *     "opts": ["hello", {"okText": "行啦"}], // 如果是数组，则被当成多个参数，如果不是，则不会
 *     "events": ["hide"]
 * });
 *
 * dia.bind("hide", function(ev) {
 *     //console.log(ev);
 * });
 *
 * dia.show();
 */

var postMessager = require("lib/io/postMessager");
var base = require("lib/comp/base");
var merge = require("lib/json/merge");

module.exports = function(opts) {
    var that = base();
    var messager = postMessager(function(ev) {
        that.fire(ev.data.type, ev.data.data);
    });

    that.show = function() {
        messager.send(merge({
            "for": "plugin/dialog/server"
        }, opts || {}));
    }

    return that;
}