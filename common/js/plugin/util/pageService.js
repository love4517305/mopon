
var pageEvents = {};
var hashEvents = {};
var each = require("lib/util/each");

var that = {
    bind: function(key, fn){
        if (typeof(fn) != "function") {
            return;
        }

        if (!(key in pageEvents)) {
            pageEvents[key] = [];
        }

        var flat = true;
        each(pageEvents[key], function(item) {
            if (item === fn) {
                flat = false;
                return false;
            }
        });

        if(flat){
            var hash = "/proxy.html#" + location.hash.substr(1);
            pageEvents[key].push({fn: fn, hash: hash});
            if(!(hash in hashEvents)){
                hashEvents[hash] = [];
            }
            each(hashEvents[hash], function(item){
                if(key === item){
                    flat = false;
                    return false;
                }
            });
            flat && hashEvents[hash].push(key);
        }
    },
    unbind: function(key, fn){
        if (!(key in pageEvents)) {
            return;
        }
        each(pageEvents[key], function(item, index) {
            if (item.fn === fn) {
                pageEvents[key].splice(index, 1);
                return false;
            }
        });
    },
    destroy: function(url){
        if (!(url in hashEvents)) {
            return;
        }
        var keys = hashEvents[url];
        var keyCount = 0;
        each(keys, function(key, index){
            if(!(key in pageEvents)){
                hashEvents[url].splice(index - keyCount++, 1);
                return;
            }
            var count = 0;
            each(pageEvents[key], function(item, index){
                if(item.hash === url){
                    pageEvents[key].splice(index - count++, 1);
                }
            });
            if(pageEvents[key].length == 0){
                delete pageEvents[key];
            }
        });
        if(hashEvents[url].length == 0){
            delete hashEvents[url];
        }
    },
    fire: function(key, data){
        if (!(key in pageEvents)) {
            return;
        }
        each(pageEvents[key], function(item) {
            var evt = {
                type: key,
                target: that,
                data: data
            };

            item.fn(evt);
        });
    }
};

module.exports = that;
window.pageService = that;