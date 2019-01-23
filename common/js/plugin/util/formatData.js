/**
 * by 璩
 * 对数据对行格式
 * bool: 是否格式为[{key:1,val:1}]
 */
module.exports = function(data, name, key, val, bool) {
    var filter = require("./filterData");
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var merge = require("lib/json/merge");

    data = filter(data, name);
    key = key || "key";
    val = val || "val";
    var result = bool === true ? [] : {};
    if(getType(data) == "array"){
        each(data, function(item, index){
            if(getType(item) == "object"){
                if(bool === true){
                    result.push({key: item[key], val: item[val]});
                }else{
                    result[item[key]] = item[val];
                }
            }else{
                if(bool === true){
                    result.push({key: index, val: item});
                }else{
                    result[index] = item;
                }
            }
        });
    }else{
        return data;
    }
    return result;
}