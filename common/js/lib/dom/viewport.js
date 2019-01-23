/**
 * 允许强制将设置倍数为 1
 */
var that = module.exports;
var inited = false;
var win = window;
var doc = document;
var rootEl = doc.documentElement;
var isAndroid = win.navigator.appVersion.match(/android/gi);
var isIPhone = win.navigator.appVersion.match(/iphone/gi);

that.init = function(isMobile) {
    if (inited) return;
    var header = doc.getElementsByTagName("head")[0];
    var viewport = doc.createElement("meta");
    var dpr = 1;
    var tid = null;
    inited = true;
    var scale = 1;
    rootEl.setAttribute("data-dpr", dpr);
    rootEl.setAttribute("data-device-type", isIPhone ? "iphone" : (isAndroid ? "android" : "other"));
    viewport.name = "viewport";
    viewport.content = "initial-scale=" + scale + ", maximum-scale=" + scale + ", minimum-scale=" + scale + ", user-scalable=no";
    header.appendChild(viewport);

    function refreshRem(){//750
        var width = doc.documentElement.clientWidth;
        var rem = width / 10 * (isMobile ? 2.56 : 1);
        rootEl.style.fontSize = rem + "px";
    }

    win.addEventListener('resize', function() {
        clearTimeout(tid);
        tid = setTimeout(refreshRem, 300);
    }, false);
    win.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            clearTimeout(tid);
            tid = setTimeout(refreshRem, 300);
        }
    }, false);

    refreshRem();
};

that.px2rem = function(px) {
    return px / that.rem();
};

that.rem2px = function(rem) {
    return rem * that.rem();
};

that.rem = function() {
    return parseFloat(window.getComputedStyle(rootEl, null).fontSize, 10);
};

that.currentDpr = function() {
    return rootEl.hasAttribute("data-dpr") ? parseInt(rootEl.hasAttribute("data-dpr"), 10) : devicePixelRatio;
};

that.isAndroid = function() {
    return isAndroid;
};

that.isIPhone = function() {
    return isIPhone;
};

that.getDeviceType = function() {
    return isIPhone ? "iphone" : (isAndroid ? "android" : "other");
};