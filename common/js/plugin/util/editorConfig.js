/**
 * Created by TIAN on 2016/8/31.
 */

module.exports = function(width, height,readonly,toolbars) {
    width = width || 622;
    height = height || 200;
    toolbars = toolbars||[];
    return {
        toolbars: [['undo','redo','bold','fontsize','source','pasteplain','selectall','horizontal','removeformat','time','date','cleardoc','link','forecolor','backcolor','fullscreen','autotypeset'].concat(toolbars)],
        initialFrameWidth: width,
        initialFrameHeight: height,
        elementPathEnabled: false,
        wordCount: false,
        zIndex: 1000000,
        serverUrl: null,
        readonly: readonly ||false
    }
}