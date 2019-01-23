/**
获取当前日期N天前的日期，默认返回一周前的日期。格式为xxxx-xx-xx
 **/
//----------------require--------------
module.exports = function(daysAgo) {
    var now = new Date();
    var nDaysAgo = new Date();

    daysAgo = daysAgo || 7;
    nDaysAgo.setTime(nDaysAgo.getTime() - daysAgo*24*60*60*1000);

	return nDaysAgo;
};