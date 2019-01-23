/**
 * @author 璩
 * @data 2016-09-28
 * @description load
 */

module.exports = function(opts) {
    //----------------require--------------
    var popup = require("lib/layer/popup");
    var animate = require("lib/ani/animate");

    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点

    var that = popup('<div class="mg-win-toast">' + opts + '</div>', {
        mask: false,
        keepMiddle: true
    });

    //-------------事件响应声明---------------
    var evtFuncs = {
        show: function(){
            that.setPosition(null, "auto", null, "60px");
            custFuncs.animate();
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {

    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        that.bind("show", evtFuncs.show);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        animate: function(){
            var node = that.getOuter();
            var ani  = animate.chain(node)
                .animate({ opacity: 0.6 }, 1000, 'ease-in')
                .animate({ opacity: 0 }, 1000, 'ease-in', function(){
                    node.parentNode.removeChild(node);
                })
        }
    }

    //---------------暴露API----------------

    //-------------一切从这开始--------------

    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    return that;
};