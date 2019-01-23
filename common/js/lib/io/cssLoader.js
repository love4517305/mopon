/**
 * 加载一段css
 */

var when = require("../util/when");
var addEvent = require("../evt/add");
var removeEvent = require("../evt/remove");

module.exports = function(url) {
    var defer = when.defer();
    var style = document.createElement("link");
    style.type = "text/css";
    style.charset = "utf-8";
    style.rel = 'stylesheet';
    var onLoad = function() {
        removeEvent(style, "load", onLoad);
        removeEvent(style, "error", onError);
        defer.resolve();
    }

    var onError = function() {
        removeEvent(style, "load", onLoad);
        removeEvent(style, "error", onError);
        document.body.removeChild(style);

        defer.reject();
    }

    addEvent( style, "load", onLoad);
    addEvent( style, "error", onError);

    style.href = url;
    document.body.appendChild( style);

    return defer.promise;
}