/**
 * @data 2016-07-25
 * 修复版，只针对最顶层使用
 *
**/
var alert = require("./alert");
var confirm = require("./confirm");
var wait =  require("./wait");
var all_wait = [];
var that = {
    /**
     * 弹出警告窗
     * @param  {[type]} text       显示的信息
     * @param  {[type]} onOkOrOpts 如果是函数，则是当点击确定的时候的回调。如果是对象，则是配置信息
     * @return {[type]}            弹层对象
     */
    alert: function(text, onOkOrOpts) {
        var opts = null;

        if (typeof onOkOrOpts == "function") {
            opts = {
                "ok": onOkOrOpts
            }
        } else {
            opts = onOkOrOpts;
        }

        var m_dialog = alert(text, opts);
        m_dialog.show();

        return m_dialog;
    },
    /**
     * 弹出警告窗
     * @param  {[type]} text       显示的信息
     * @param  {[type]} onOkOrOpts 如果是函数，则是当点击确定的时候的回调。如果是对象，则是配置信息
     * @param  {[type]} onCancel   如果onOKOrOpts是函数，则允许这里传入函数作为点击取消时的回调，如果onOKOrOpts为对象，则该参数失效
     * @return {[type]}            弹层对象
     */
    confirm: function(text, onOkOrOpts, onCancel) {
        var opts = null;

        if (typeof onOkOrOpts == "function" && typeof onCancel == "function") {
            opts = {
                "ok": onOkOrOpts,
                "cancel": onCancel
            }
        } else if (typeof onOkOrOpts == "function") {
            opts = {
                "ok": onOkOrOpts
            }
        } else {
            opts = onOkOrOpts;
        }

        var m_dialog = confirm(text, opts);
        m_dialog.show();

        return m_dialog;
    },
    /**
     * 弹出等待加载
     * */
    wait: function() {
        var m_dialog = wait();
        m_dialog.show();
        all_wait.push(m_dialog);
    },
    /**
     * 关闭等待加载
     * */
    closeWait: function() {
        all_wait.forEach(function(item) {
            item.hide();
        });
        all_wait = [];
    }
};

module.exports = that;
