/**
 * 截取字符串
 */
define(function(require, exports, module) {
    //---------- require begin -------------
    //---------- require end -------------
    return function(text, pos) {
        var len = 0;
        var arr = [];
        var a = text.split("");
        for (var i = 0; i < a.length; i++) {
            if (a[i].charCodeAt(0) < 299) {
                len++;
            } else {
                len += 2;
            }
            if(len > pos){
                arr.push("...");
                break;
            }
            arr.push(a[i]);
        }
        return arr.join("");
    }
});