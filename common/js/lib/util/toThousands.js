/**
 * 千分位转化并覆盖值
 *
 * 例子：
 *  var thousands = require("../util/thousands");
 *  var obj = [{a:1000,b:200},{c:"abc",d:"2015-10-10"}];
 *  thousands(obj); //[{a:"1,000",b:"2,000"},{c:"abc",d:"2015-10-10"}]
 *  thousands(obj,"a,b"); ////[{a:"1000",b:"2000"},{c:"abc",d:"2015-10-10"}]
 *
 */

var each = require("../util/each");

module.exports = function(opts,filter) {
    function changeNum (num) {
        num = num + "";
        if (num == "") {
            return num;
        }
        if (isNaN(num)){
            return num;
        }
        var index = num.indexOf(".");
        var reg = /(-?\d+)(\d{3})/;
        if (index==-1) {
            while (reg.test(num)) {
                num = num.replace(reg, "$1,$2");
            }
        } else {
            var intPart = num.substring(0, index);
            var pointPart = num.substring(index + 1, num.length);
            while (reg.test(intPart)) {
                intPart = intPart.replace(reg, "$1,$2");
            }
            num = intPart +"."+ pointPart;
        }
        return num;
    }
    var filterObj = {};
    if(typeof filter == "string"){
        filter.split(",").forEach(function(v){
            filterObj[v] = null;
        });
        each(opts,function(v){
            for(var k in v){
                if(!(k in filterObj)){
                    v[k] = changeNum(v[k])
                }
            }
        });
    }else{
        each(opts,function(v){
            for(var k in v){
                v[k] = changeNum(v[k])
            }
        });
    }
};
