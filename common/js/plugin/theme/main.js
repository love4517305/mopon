/***********
 * 皮肤管理集合
 * by: 璩
 */
(function(href){
    var themeUtils = {
        skin: "cloud-let",
        path: "./login/dist/",
        pathMap: {
            '203.195.128.135:8288': 'cloud-let',//兜有云生产
            'fcloud.mopon.cn:8288': 'cloud-let',//兜有云生产
            '172.16.10.38': 'cloud-let',//兜有准生产
            '172.16.10.55:41': 'cloud-let',//兜有云测试
            'cloud.cfc.com.cn': 'cloud-zy',//中影云生产
            '172.16.10.55:40': 'cloud-zy',//中影云测试
            'cloud.omnijoi.cn': 'cloud-xflh',//福泰云生产
            'ftypre.omnijoi.cn': 'cloud-xflh',//福泰准生产
            '172.16.10.55:61': 'cloud-xflh',//福泰云测试
        },
        setSkin: function(){
            var obj = this.getParse(href);
            if(this.pathMap[obj.host]){
                this.skin = this.pathMap[obj.host];
            }
        },
        createScript: function(url){
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = this.path + url + this.timestamp();
            document.getElementsByTagName("head")[0].appendChild(script);
        },
        getParse: function(url){
            var link = document.createElement("A");
            link.href = url;

            return {
                "url": url,
                "scheme": link.protocol,
                "host": link.host,
                "port": link.port,
                "path": link.pathname
            };
        },
        includes: function(code){
            return href.indexOf(code) > -1;
        },
        timestamp: function(){
            return "?ver=" + new Date().getTime();
        },
        config: {
            login: {
                "cloud-zy": "login.js",
                "cloud-ng": "cloudng/login.js",
                "cloud-let": "cloudlet/login.js",
                "cloud-xflh": "xflhLogin/login.js",
                "cloud-freely": "cloudfreely/login.js",
                "cloud-hq": "cloudhq/login.js",
                "cloud-my": "cloudmy/login.js"
            },
            nav: {
                "cloud-zy": "nav.js",
                "cloud-ng": "cloudng/nav.js",
                "cloud-let": "cloudlet/nav.js",
                "cloud-xflh": "xflhLogin/nav.js",
                "cloud-freely": "cloudfreely/nav.js",
                "cloud-hq": "cloudhq/nav.js",
                "cloud-my": "cloudmy/nav.js"
            }
        },
        init: function(){
            this.setSkin();
            document.body.className = this.skin;
            if(this.includes("login.html") || !this.includes(".html")){
                this.createScript(this.config.login[this.skin]);
            }else if(this.includes("nav.html")){
                this.createScript(this.config.nav[this.skin]);
            }else if(this.includes("frame.html")){
            }else if(this.includes("proxy.html")){
            }
        }
    };
    themeUtils.init();
    module.exports = themeUtils.skin;
})(window.location.href);