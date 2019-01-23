/**
 * iframe中可以引用本模块，然后获取父窗口的弹层
 * 注意：不管在哪，引用本模块都没有问题！
 */

var manager = {
    getDialog: function(id) {
        if (top.dialogManager) {
            return top.dialogManager.getDialog(id);
        } else {
            return null;
        }
    },
    getPop: function(id){
        if (top.dialogManager) {
            return top.dialogManager.getPop(id);
        } else {
            return null;
        }
    },
    /**
     * 弹出警告窗
     * @param  {[type]} text       显示的信息
     * @param  {[type]} onOkOrOpts 如果是函数，则是当点击确定的时候的回调。如果是对象，则是配置信息
     * @return {[type]}            弹层对象
     */
    alert: function(text, onOkOrOpts) {
        return top.dialogManager.alert(text, onOkOrOpts);
    },
    /**
     * 弹出警告窗
     * @param  {[type]} text       显示的信息
     * @param  {[type]} onOkOrOpts 如果是函数，则是当点击确定的时候的回调。如果是对象，则是配置信息
     * @param  {[type]} onCancel   如果onOKOrOpts是函数，则允许这里传入函数作为点击取消时的回调，如果onOKOrOpts为对象，则该参数失效
     * @return {[type]}            弹层对象
     */
    confirm: function(text, onOkOrOpts, onCancel) {
        return top.dialogManager.confirm(text, onOkOrOpts, onCancel);
    },
    /**
     * 弹出等待框
     */
    wait: function() {
        return top.dialogManager.wait();
    },
    /**
     * 关闭等待框
     */
    closeWait: function() {
        return top.dialogManager.closeWait();
    },
    toast: function(msg){
        return top.dialogManager.toast(msg);
    },
    bind: function(key, fn){
        top.pageService.bind(key, fn);
    },
    unbind: function(key, fn){
        top.pageService.unbind(key, fn);
    },
    fire: function(key, data){
        top.pageService.fire(key, data);
    },
    reload: function(url){
        top.framesManager.reload(url);
    },
    createScript: function(url){
        top.framesManager.createScript(url);
    }
};

module.exports = manager;