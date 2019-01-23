/**
 * 提供了对frames的各种控制
 */
module.exports = {
    /**
     * 检查是否有某个地址的iframe
     * @param  {string}  url /rmp/material/list?text=12234 注意不要包括前边的frame.html#
     */
    has: function(url) {
        if (top.framesManager == null) {
            return;
        }

        return top.framesManager.has(url);
    },
    /**
     * 让某个frame重新加载
     * @param  {string}  url /rmp/material/list?text=12234 注意不要包括前边的frame.html#
     */
    reload: function(url) {
        if (top.framesManager == null) {
            return;
        }

        top.framesManager.reload(url);
    }
}