/**
 * @author benny.zheng
 * @data 2016-07-19
 * @description 代理各个页面的加载
 */
//----------------require--------------
var runtime = require("plugin/runtime");
var theme = require("plugin/theme/main");
var script = document.createElement("script");

script.charset = "utf-8";
script.type = "text/javascript";
script.src = "./" + runtime.getModuleName() + "/dist" + runtime.getPath() + ".js?ver=" + new Date().getTime();
document.body.appendChild(script);
