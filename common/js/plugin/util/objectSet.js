/**
 * by 璩
 * 对一个对象进行赋值
 */
module.exports = function(data, name, value) {
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");

    if(!name || getType(data) !== "object") return data;
    try {
        var result = [data],
            isNull = function(res){
                return getType(res) === "undefined";
            },
            objectSet = function(names){
                var reg = /\[([\s\S]+?)\]/g,
                    bool = false,
                    len = names.length;
                each(names, function(v, index){
                    if(bool) return false;
                    var arr = [];
                    v = v.replace(reg,function(a,b){arr.push(b);return "";});
                    var aLen = arr.length;
                    if(index === len - 1 && aLen === 0){
                        if(getType(result[result.length - 1][v]) !== "undefined"){
                            result[result.length - 1][v] = value;
                        }
                        bool = true;
                        return false;
                    }
                    result.push(result[result.length - 1][v]);
                    if(isNull(result[result.length - 1])) return false;
                    each(arr, function(val, i){
                        if(index === len - 1 && i === aLen - 1){
                            if(getType(result[result.length - 1][val]) !== "undefined"){
                                result[result.length - 1][val] = value;
                            }
                            bool = true;
                            return false;
                        }
                        result.push(result[result.length - 1][val]);
                        bool = isNull(result[result.length - 1]);
                        if(bool) return false;
                    });
                });
            };
        objectSet(name.split("."));
    } catch (ex) {}
}