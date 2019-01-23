/**
 * 针对移动端
 * @description 代理各个页面的加载
 */
//----------------require--------------
var runtime = require("plugin/runtime");
var theme = require("plugin/theme/main");
require("vs/plugin/register");
require("root/common/frame/main.scss");
require("plugin/dialog/manager");
require("plugin/util/pageService");
(require("vs/plugin/dialog/manager").default).init(theme);
var localForage = require("plugin/util/localforage");
var queryToJson = require("lib/json/queryToJson");
var jsonToQuery = require("lib/json/jsonToQuery");

window.addEventListener("hashchange", function(res){
    var query = queryToJson(res.oldURL.split('?')[1]);
    var nQuery = queryToJson(res.newURL.split('?')[1]);
    if(query.appid && !nQuery.appid){
        nQuery.appid = query.appid;
        location.replace(res.oldURL);
        location.href = res.newURL.split('?')[0] + '?' + jsonToQuery(nQuery);
    }
    location.reload();
});

(function(){
    var query = queryToJson(location.href.split('?')[1]);
    if(query.text){
        document.title = query.text;
    }
    var timer = setInterval(loadCinema, 2000);

    function loadCinema () {
        for(var i = 1; i <= 5; i++){
            (function(v){
                localForage.getItem("window.cache" + v)
                    .then(res => {
                        window["cache" + v] = res;
                    });
            })(i === 1 ? '':i);
        }
        if(window.sessionStorage.getItem('cinema.stop') === '1'){//加载完毕
            clearInterval(timer);
            window.sessionStorage.removeItem('cinema.stop');
            //localForage.clear();
            timer = setInterval(loadCinema, 15 * 60 * 1000);
        }
    }

    loadCinema();
})();

window.framesManager = {
    reload: function(url) {},
    createScript: function(url){
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        document.body.appendChild(script)
    }
};

window.framesManager.createScript("./mobile/dist/" + runtime.getModuleName() + "/" + runtime.getPath() + ".js?ver=" + new Date().getTime());
