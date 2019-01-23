/**
 * 获取屏幕dpi
 */

export default function () {
    let dpi = {};
    if (window.screen.deviceXDPI) {
        dpi.x = window.screen.deviceXDPI;
        dpi.y = window.screen.deviceYDPI;
    }
    else {
        let tmpNode = document.createElement("DIV");
        tmpNode.style.cssText = "width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden";
        document.body.appendChild(tmpNode);
        dpi.x = parseInt(tmpNode.offsetWidth);
        dpi.y = parseInt(tmpNode.offsetHeight);
        tmpNode.parentNode.removeChild(tmpNode);
    }
    return dpi;
}
