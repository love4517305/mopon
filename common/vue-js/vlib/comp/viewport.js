/**
 * 允许强制将设置倍数为 1
 * 移动适配解决方案
 */
const viewport = {
    isAndroid : navigator.appVersion.match(/android/gi),
    isIPhone : navigator.appVersion.match(/iphone/gi),
    init (absDpr) {
        const doc = document;
        const rootEl = doc.documentElement;
        const header = doc.getElementsByTagName("head")[0];
        let viewport = doc.createElement("meta");
        let fontScale = doc.createElement("meta");
        let devicePixelRatio = window.devicePixelRatio;
        let dpr = null;
        let tid = null;
        let rDpr = null;

        if (typeof devicePixelRatio === "number") {
            if (devicePixelRatio >= 3) {
                rDpr = 3;
            } else if (devicePixelRatio >= 2) {
                rDpr = 2;
            } else {
                rDpr = 1;
            }
        } else {
            rDpr = absDpr || 1;
        }
        dpr = typeof absDpr === "number" ? +absDpr : (this.isIPhone ? rDpr : 1);
        const scale = 1 / dpr;
        const type = this.isIPhone ? "iphone" : (this.isAndroid ? "android" : "other");
        rootEl.setAttribute("data-dpr", dpr);
        rootEl.setAttribute("data-device-type", type);
        rootEl.classList.add(type + "-data-dir-" + rDpr);
        viewport.name = "viewport";
        viewport.content = "initial-scale=" + scale + ", maximum-scale=" + scale + ", minimum-scale=" + scale + ", user-scalable=no";
        header.appendChild(viewport);
        fontScale.name = "wap-font-scale";
        fontScale.content = "no";
        header.appendChild(fontScale);

        const refreshRem = function(){
            let width = doc.documentElement.clientWidth;
            let height = doc.documentElement.clientHeight;
            let sp = 1920 / 1080;
            if(width === 0 || !width){
                width = rootEl.getBoundingClientRect().width;
            }

            if(width / height >= sp){
                const rem = (Math.max(1200, height * sp) / 10);
                rootEl.style.fontSize = rem + "px";
            }else{
                const rem = (Math.max(1200, width) / 10);
                rootEl.style.fontSize = rem + "px";
            }
        };

        window.addEventListener('resize', function() {
            clearTimeout(tid);
            tid = setTimeout(refreshRem, 300);
        }, false);
        window.addEventListener('pageshow', function(e) {
            if (e.persisted) {
                clearTimeout(tid);
                tid = setTimeout(refreshRem, 300);
            }
        }, false);

        refreshRem();
    },
    rem () {
        return parseFloat(window.getComputedStyle(document.documentElement, null).fontSize, 10);
    },
    px2rem (px) {
        return px / this.rem();
    },

    rem2px (rem) {
        return rem * that.rem();
    },
    curDpr () {
        return document.documentElement.hasAttribute("data-dpr") ? parseInt(document.documentElement.hasAttribute("data-dpr"), 10) : window.devicePixelRatio;
    },
    getDeviceType () {
        return this.isIPhone ? "iphone" : (this.isAndroid ? "android" : "other");
    }
};

export default viewport;