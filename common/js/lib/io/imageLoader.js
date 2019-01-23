/**
 * 实现image预加载功能
 * 例子：
 * var loader = require("../io/imageLoader");
 * var console = require("../io/console");
 *
 * timeout为毫秒数
 * loader("/xxx/xxx.png", function(image) {
 *     if (image == null) {
 *         console.log("加载失败")
 *     } else {
 *         console.log("已经加载成功");
 *         window.body.appendChild(image);
 *     }
 * }, timeout);
 */
module.exports = function(url, callback, timeout) {
    var timeID = 0;
    var img = new Image();
    img.src = url;

    if (timeout) {
        timeID = setTimeout(function() {
            callback(null);
            img.onload = img.onerror = null;
        }, timeout);
    }

    if (img.complete) {
        timeout && clearTimeout(timeID);
        callback(img);
    } else {
        img.onload = function() {
            img.onload = null;
            img.onerror = null;
            timeout && clearTimeout(timeID);
            callback(img);
        }

        img.onerror = function() {
            img.onload = null;
            img.onerror = null;
            timeout && clearTimeout(timeID);
            callback(null);
        }
    }

}