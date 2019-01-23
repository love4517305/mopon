/**
 * 主框架页hash路由功能
 */
var addEvent = require("lib/evt/add");
var base = require("lib/comp/base");
var each = require("lib/util/each");
var getType = require("lib/util/getType");
var URL = require("lib/util/URL");
var that = module.exports = base();
var storage = require("vlib/util/storage").default;
var defaultUrl = "/login.html";

var parseHash = function() {
    var hash = location.hash.substr(1);
    var sessionHash = storage.get("hash.url");
   //console.log("hash:", hash, location.hash, location.hash.substr(1))
    if (hash == "") {
        if(sessionHash){
            hash = sessionHash;
        }else{
            location.href = defaultUrl;
            return;
        }
    }else if(hash != sessionHash){
        storage.put("hash.url", hash);
    }

    // var url = URL.parse(hash);
    var array = hash.split("?");
    that.fire("change", array);
}

that.start = function() {
    parseHash();
    addEvent(window, "hashchange", parseHash);
}

that.getDefaultUrl = function() {
    return defaultUrl;
}
