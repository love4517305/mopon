/**
 * 消息管理
 */
var base = require("lib/comp/base");
var runtime = require('plugin/runtime');
var when = require("lib/util/when");
var ajax = require("lib/io/ajax");
var dialogManager = require("plugin/dialog/manager");
var that = module.exports = base();
var defaultURL = '/proxy/cloud';
// var defaultURL = '/proxy/info';

that.getMsgDetailById = function(data) {
    //查看消息详情的同时调用此接口，将对应消息状态修改为已读
    var defer = when.defer();
    ajax({
        // url: defaultURL + '/platform/message/readDetailById',
        // data: data,
        url: 'proxy/mmc/mmc/updateMsgStatus',
        data: {params: JSON.stringify(data)},
        method: "POST",
        onSuccess: function(res) {
            if (res.code == 0) {
                defer.resolve(res); 
            } else {
                defer.reject(res.msg);
                dialogManager.alert(res.msg);
            }
        },
        onError: function(req) {
            console.error(runtime.getHttpErrorMessage(req));
        }
    });
    return defer.promise;
};

that.countMessage = function() {
    var defer = when.defer();
    ajax({
        url: 'proxy/mmc/mmc/queryUndoMsgCount',
        method: "POST",
        data: {params: JSON.stringify({})},
        onSuccess: function(res) {
            if (res.code == 0) {
                defer.resolve(res);
            } else {
                defer.reject(res.msg);
                console.error(res.msg);
            }
        },
        onError: function(req) {
            console.error(runtime.getHttpErrorMessage(req));
        }
    });
    return defer.promise;
};

that.getTopMessage = function() {
    var defer = when.defer();
    ajax({
        url: '/proxy/mmc/mmc/queryUndoMsg',
        method: "POST",
        data: {params: JSON.stringify({})},
        onSuccess: function(res) {
            if (res.code == 0) {
                defer.resolve(res);
            } else {
                defer.reject(res.msg);
                //dialogManager.alert(res.msg);
                // console.error(res.msg);
            }
        },
        onError: function(req) {
            console.error(runtime.getHttpErrorMessage(req));
        }
    });
    return defer.promise;
};

that.getMsgList = function(data) {
    var defer = when.defer();
    ajax({
        url: defaultURL + '/platform/message/queryPagination',
        data: data,
        method: "POST",
        onSuccess: function(res) {
            if (res.code == 0) {
                defer.resolve(res);
            } else {
                defer.reject(res.msg);
                dialogManager.alert(res.msg);
            }
        },
        onError: function(req) {
            console.error(runtime.getHttpErrorMessage(req));
        }
    });
    return defer.promise;
};