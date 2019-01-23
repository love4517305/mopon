/**
 * 获取AJAX请求对象，本文件是提供给ajax.js使用，一般不需要使用它
 */

var console = require("../io/console");

module.exports = function() {
    var xmlhttp = null;

    if ("XMLHttpRequest" in window) {
        xmlhttp = new XMLHttpRequest();
    } else {
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (ex) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (ex) {
                console.error("无法创建XMLHttpRequest对象");
            }
        }
    }

    return xmlhttp;
}
