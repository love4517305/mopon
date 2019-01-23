/**
导出文件
 **/
//----------------require--------------
module.exports = function(src) {
    var frame = document.createElement("iframe");
    frame.src = src;
    frame.className = "hide";
    document.body.appendChild(frame);
};