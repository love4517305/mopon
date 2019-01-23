 /*
  *通用模块
   */

var modules = {
    "lib/layer/popup": require("lib/layer/popup"),
    "plugin/dialog/alert": require("./alert"),
    "plugin/dialog/confirm": require("./confirm"),
    "plugin/dialog/win": require("./win"),
    "plugin/dialog/dialog": require("./dialog"),
    "plugin/dialog/wait": require("./wait"),
    "plugin/dialog/toast": require("./toast"),
    "plugin/module/selectCinemaDialog": require("plugin/module/selectCinemaDialog"),
    "plugin/module/newSelectCinemaDialog": require("plugin/module/newSelectCinemaDialog"),
    "plugin/module/fixedGrid": require("plugin/module/fixedGrid"),
    "plugin/drawBoard/editContent": require("vs/plugin/drawBoard/EditContent.vue")
};


var all_wait = [];

var that = {
    putModules: function(obj, module, child){
        for(var k in obj){
            modules[k] = obj[k];
        }
        window.childModuleFinish(module, child);
    },
    getModules: function(id){
        if(modules[id]) return modules[id];
        if(/^root\/(\w+)\//.test(id)){
            var mod = RegExp.$1;
            if(window[mod + "_modules"]){
                return window[mod + "_modules"][id];
            }
        }
    },
    getDialog: function(id) {
        return that.getModules(id);
    },
    getPop: function(id) {
        return that.getModules(id);
    },
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

        var dialog = that.getDialog("plugin/dialog/alert");
        var m_dialog = dialog(text, opts);
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

        var dialog = that.getDialog("plugin/dialog/confirm");
        var m_dialog = dialog(text, opts);
        m_dialog.show();

        return m_dialog;
    },
    /**
     * 弹出等待加载
     * */
    wait: function() {
        var dialog = that.getDialog("plugin/dialog/wait");
        var m_dialog = dialog();
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
    },
    toast: function(str) {
        var dialog = that.getDialog("plugin/dialog/toast");
        var m_toast = dialog(str);
        m_toast.show();
    }
};

module.exports = that;
window.dialogManager = that;