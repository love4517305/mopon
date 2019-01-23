/**
 * by 璩
 * 对数据进行过滤
 */
module.exports = function(data, name) {
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var merge = require("lib/json/merge");
    var clone = require("lib/json/clone");

    if(!name || getType(data) !== "object") return data;

    var fd = clone(data),
        isNull = function(res){
            return getType(res) === "undefined";
        },
        filter = function(res, names){
            var reg = /\[([\s\S]+?)\]/g,
                bool = false;
            each(names, function(v){
                if(bool) return false;
                var arr = [];
                v = v.replace(reg,function(a,b){arr.push(b);return "";});
                res = res[v];
                if(isNull(res)) return false;
                each(arr, function(val){
                    res = res[val];
                    bool = isNull(res);
                    if(bool) return false;
                });
            });
            return res;
        };

    try {
        if(getType(name) === "array"){
            return filter(fd, name);
        }else if(getType(name) === "string"){
            if(name.indexOf(",") > -1){
                var obj = {}, bool = true;
                each(name.split(","), function(v){
                    var result = filter(fd, v.split("."));
                    if(!isNull(result)){
                        bool = false;
                        obj = merge(obj, result);
                    }
                });
                return bool ? undefined : obj;
            }
            return filter(fd, name.split("."));
        }
        return data;
    } catch (ex) {
        return undefined;
    }
}