/**
 * 停止事件冒泡
 * 例子请阅读add函数
 */

var getEvent = require("../evt/get");

module.exports = function(event) {
    event = event || getEvent();

    if (event.stopPropagation) {
        event.stopPropagation();
    } else {
        event.returnValue = false;
    }

    return false;
};
