/**
 * 日期操作工具
 * by 璩
 */
var formatDate = require("./formatDate");

module.exports = function () {
    var that = {};

    var months = [31,28,31,30,31,30,31,31,30,31,30,31];

    that.getDate = function () {
        return new Date();
    };

    /**************
     *返回当月天数
     * @param year
     * @param month
     * @returns {number}
     */
    that.getMonthDay = function(year, month){
        if(year instanceof Date){
            month = year.getMonth();
            year = year.getFullYear();
        }

        if (((0 == (year % 4)) && ((0 != (year % 100)) || (0 == (year % 400)))) && month == 1){
            return 29;
        } else {
            return months[month];
        }
    };
    /*******
     * 返回当前日期的第一天
     * @param date
     */
    that.getCurDateFirst = function(date) {
        date = that.parse(date);
        var day = date.getDate();
        return that.getOffsetDate(date, -day + 1);
    };

    /**********
     * 返回当前日期的上一月的第一天
     * @param date
     */
    that.getPrevDateFirst = function(date){
        var prevDate = that.getPrevDateLast(date);
        var day = that.getMonthDay(prevDate);
        return that.getOffsetDate(prevDate, -day + 1);
    };

    /**********
     * 返回当前日期的上一月的最后一天
     * @param date
     */
    that.getPrevDateLast = function(date){
        date = that.parse(date);
        var day = date.getDate();
        return that.getOffsetDate(date, -day);
    };

    /**********
     * 返回当前日期的下一月的第一天
     * @param date
     */
    that.getNextDateFirst = function(date){
        date = that.parse(date);
        var day = that.getMonthDay(date) - date.getDate();
        return that.getOffsetDate(date, day + 1);
    };

    /**********
     * 返回当前日期的下一月的最后一天
     * @param date
     */
    that.getNextDateLast = function(date){
        var nextDate = that.getNextDateFirst(date);
        var day = that.getMonthDay(nextDate);
        return that.getOffsetDate(nextDate, day - 1);
    };

    /**********
     * 将字符串转成日期
     * @param date
     */
    that.parse = function(date){
        if(date instanceof Date) return date;
        return new Date(that.format(date).replace(/\-/g, "/"));
    };

    /******************
     * 将日期转成字符串
     * @param date
     * @param format
     * @returns {*}
     */
    that.format = function (date, format) {
        return formatDate(date, format);
    };

    /******************
     * 返回时间戳
     * @type {that.now}
     */
    that.getTimestamp = that.now = function(date){
        if(!date) return that.getDate().getTime();
        return that.parse(date).getTime();
    };

    /*****************
     * 比较两个日期相差多少天
     * @param date1
     * @param date2
     * @returns {number}
     */
    that.getCompareDateDay = function(date1, date2){
        var time1 = that.getTimestamp(date1);
        var time2 = that.getTimestamp(date2);
        return (time2 - time1) / (1000 * 3600 * 24);
    };

    /****************
     * 比较两个时间相差多少天
     * @param time1
     * @param time2
     * @returns {number}
     */
    that.getCompareTimeDay = function(time1, time2){
        var date = that.format(that.getDate(), "yyyy-MM-dd");
        return that.getCompareDateDay(date + " " + time1, date + " " + time2);
    };

    /***********
     * 返回一个日期向前或向后多少天的新日期字符串
     * @param date
     * @param value
     * @param format
     * @returns {*}
     */
    that.getOffsetDateStr = function(date, value, format){
        return that.format(that.getOffsetDate(date, value), format || "yyyy-MM-dd");
    };

    /********************
     * 返回一个日期向前或向后多少天的新日期
     * @param date
     * @param value
     */
    that.getOffsetDate = function(date, value){
        var time = value * 24 * 3600 * 1000;
        var newTime = that.getTimestamp(date) + time;
        return that.parse(newTime);
    };

    return that;
};