/*******
 * 配置处理URL
 */
module.exports = function(url, fn) {
    var href = location.href;
    if(/#\/(\w+)\//.test(href)) {
        var mod1 = RegExp.$1;
        var newUrl = function(json){
            try{
                var mod2 = null;
                if(/#\/(\w+\/\w+)\//.test(href)){
                    mod2 = RegExp.$1;
                }
                var obj = JSON.parse(json);
                var result = mod2 ? (obj[mod2] ? obj[mod2] : obj[mod1]) : obj[mod1];
                if(result){
                    var fix_url = ((result.config && result.config.url) ? result.config.url: "").replace(/\/$/, "");
                    var fix_proxy = (result.config && result.config.proxy) ? result.config.proxy: null;
                    var redirect_proxy = (result.redirect && result.redirect.proxy) ? result.redirect.proxy: null;
                    var redirect_to = (result.redirect && result.redirect.to) ? result.redirect.to: null;
                    var set = result.post || {};
                    var arr = url.split("?");
                    var param = arr.length == 2 ? "?" + arr[1] : "";
                    var item = set[arr[0].replace(/^\//, "")];
                    if(item && item.fix && item.url && (item.proxy || fix_proxy)){
                        var n_proxy = (item.proxy || fix_proxy).replace(/\/$/, "");
                        var n_url = item.url.replace(/^\//, "");
                        return n_proxy + "/" + fix_url + (fix_url ? "/" : "") + n_url + param;
                    }else if(item && item.proxy && item.url){
                        return item.proxy.replace(/\/$/, "") + "/" + item.url.replace(/^\//, "") + param;
                    }else if(redirect_proxy && redirect_to){
                        return url.replace(new RegExp("^" + redirect_proxy), redirect_to);
                    }
                }
                return url;
            }catch(e){
                return url;
            }
        };

        if(window.localStorage && window.localStorage.getItem("_config.url.json")){
            var data = window.localStorage.getItem("_config.url.json");
            fn(newUrl(data));
        }else{
            var xhr = new XMLHttpRequest();
            var timer = null;
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4) {
                    clearTimeout(timer);
                    if (xhr.status == 200) {
                        var data = xhr.responseText;
                        if(window.localStorage){
                            window.localStorage.setItem("_config.url.json", data);
                        }
                        fn(newUrl(data));
                    } else {
                        fn(url);
                    }
                }
            };
            xhr.open("get", "/common/config/url.json?ver=" + new Date().getTime(), true);
            xhr.send();
            timer = setTimeout(function(){
                timer = null;
                xhr.abort();
                fn(url);
            }, 2000);
        }
    }else{
        if(window.localStorage && window.localStorage.getItem("_config.url.json")){
            window.localStorage.removeItem("_config.url.json");
        }
        fn(url);
    }
};