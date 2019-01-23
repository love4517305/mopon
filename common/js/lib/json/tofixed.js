/**
 * 如果是整数时保留2个0
 * var toFixed = require("lib/json/toFixed");
 * toFixed({totalAmount1:10,totalAmount2:10.05},["Amount"]//支持多个匹配); //结果为 {totalAmount1:10.00,totalAmount2:10.05}
 *
 */

var each = require("lib/util/each");
var clone = require("lib/json/clone");

var toFixed = module.exports = function (obj,keyArr) {
    var objs = clone(obj);
    function getData(json) {
        each(json, function(item,key) {
            if(typeof(item) == "object"){
                getData(item);
            }else{
                each([].concat(keyArr),function(k){
                    if(key.indexOf(k) != -1 && typeof(item*1) == "number"){
                        json[key] = (item*1).toFixed(2);
                    }
                })
            }
        });
    }
    getData(objs);
    return objs;
}
