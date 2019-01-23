/**
 * 移端端popup弹框
 * 璩  2018/11/02
 */
define(function(require, exports, module) {
    //---------- require begin -------------
    var compBase = require('lib/comp/base');
    var getType = require('lib/util/getType');
    var merge = require('lib/json/merge');
    var contains = require('lib/dom/contains');
    var setStyle = require('lib/dom/setStyle');
    var Overlay = require('./overlay');
    var styleAni = document.createElement('style');
    var uniqueId = Math.round(Math.random() * 1000);

    (function(){//注入样式
        var styleEl = document.createElement('style');
        styleEl.innerHTML = '.m-popup-'+uniqueId+' {position: fixed;left: 0;top: 0;}\n.m-popup-'+uniqueId+'.gently-move{transition: all .3s linear;}\n.m-overlay {position: fixed;left: 0; top: 0;width: 100%; height: 100%; opacity: 0;transition: all .3s linear;}';
        document.body.appendChild(styleEl);
    })();

    return function(html, opts){
        //---------- require end -------------

        var that = compBase();
        var node = document.createElement('DIV');

        var nodeList = {};
        var config = {
            zIndex: compBase.getZIndex(),
            isShow: false,
            status: false,
            showFinish: null,
            hideFinish: null
        };

        opts = merge(true, {
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            width: 'auto',
            height: 'auto',
            overlay: {
                show: true,
                color: '#000',
                opacity: 0.4
            },
            autoHide: false,
            showCenter: false,// 显示的时候保持居中
            animate: {
                show: true,
                name: "scale",
                duration: 300,
                beforeEnter: function(){},
                enter: function(){},
                leave: function(){}
            }
        }, opts || {});

        var Animation = function (){
            var animate = {};
            opts.animate.beforeEnter(node);
            this.translateX = function(x){
                animate.transform = 'translateX('+x+')';
                return this;
            };
            this.translateY = function(y){
                animate.transform = 'translateY('+y+')';
                return this;
            };
            this.scale =function(r){
                animate.transform = 'scale('+r+')';
                return this;
            };
            this.opacity = function(o){
                animate.opacity = o;
                return this;
            };
            this.step = function(timer){
                opts.animate.enter(node);
                animate.transition = 'all '+timer+'ms linear';

                if(timer === 0){
                    var arr = [];
                    for(var k in animate){
                        arr.push(k +': ' + animate[k]);
                    }
                    styleAni.innerHTML = '.m-popup-'+uniqueId+'{' + arr.join(';') + '}';
                }else{
                    setTimeout(function(){
                        setStyle(node, animate);
                        animate = {};
                    }, 10);
                }

                setTimeout(function(){
                    opts.animate.leave(node);
                }, timer + 10);
            }
        };

        //---------------事件定义----------------
        var evtFuncs = {
            autoClickHide: function (evt) {
                if(contains(node, evt.target)) return;
                custFuncs.hide(null, "auto");
            }
        };

        //-----------------绑定事件---------------
        var bindEvents = function () {

        };

        //-----------------自定义函数-------------
        var custFuncs = {
            initPopup: function() {
                node.classList.add('m-popup-' + uniqueId);
                document.body.appendChild(styleAni);
                if(getType(html) === 'string'){
                    node.innerHTML = html;
                    var nodes = [].slice.call(node.querySelectorAll('[node-name]'));
                    nodes.forEach(function(item){
                        var name = item.getAttribute('node-name');
                        item.removeAttribute('node-name');
                        var res = nodeList[name];
                        if(res){
                            if(getType(res) === 'array'){
                                nodeList[name].push(item);
                            }else{
                                nodeList[name] = [res, item];
                            }
                        }else{
                            nodeList[name] = item;
                        }
                    });
                }
                if(opts.showCenter){
                    opts.animate.name = 'fade';
                }
                if(opts.animate.show){
                    custFuncs.setAnimate(false, 0);
                }
                custFuncs.setPopupStyle();
            },
            setAnimate: function (bool, timer, fn) {
                var res = new Animation();
                switch (opts.animate.name) {
                    case "fade":
                        res.opacity(bool ? 1 : 0).step(timer);
                        break;
                    case "slide-up":
                        res.translateY(bool ? 0 : custFuncs.addUnit(-window.innerHeight)).step(timer);
                        break;
                    case "slide-down":
                        res.translateY(bool ? 0 : custFuncs.addUnit(window.innerHeight)).step(timer);
                        break;
                    case "slide-left":
                        res.translateX(bool ? 0 : custFuncs.addUnit(-window.innerWidth)).step(timer);
                        break;
                    case "slide-right":
                        res.translateX(bool ? 0 : custFuncs.addUnit(window.innerWidth)).step(timer);
                        break;
                    default:
                        res.scale(bool ? 1 : 0.8).step(timer);
                }
                if(getType(fn) === 'function'){
                    setTimeout(function(){
                        fn();
                    }, timer);
                }
            },
            addUnit: function (value){
                return /\d$/.test(value) ? value + 'px' : value;
            },
            bindEvent: function () {
               setTimeout(function(){
                   opts.autoHide && window.addEventListener('touchstart', evtFuncs.autoClickHide);
               }, 10);
            },
            unbindEvent: function () {
                opts.autoHide && window.removeEventListener('touchstart', evtFuncs.autoClickHide);
            },
            setTop: function (index) {
                config.zIndex = getType(index) === 'number' ? index : compBase.getZIndex();
                setStyle(node, {zIndex: config.zIndex});
            },
            setFullScreen: function (horizontal, vertical) {
                if(horizontal){
                    opts.width = custFuncs.addUnit(window.innerWidth);
                }else{
                    opts.width = "auto";
                }
                if(vertical){
                    opts.height = custFuncs.addUnit(window.innerHeight);
                }else{
                    opts.height = "auto";
                }
            },
            setPosition: function (left, top, right, bottom){
                getType(left) !== 'undefined' && (opts.left = left);
                getType(top) !== 'undefined' && (opts.top = top);
                getType(right) !== 'undefined' && (opts.right = right);
                getType(bottom) !== 'undefined' && (opts.bottom = bottom);
                custFuncs.setPopupStyle();
            },
            getOverlay: function () {
                return Overlay.overlay;
            },
            getStatus: function () {
                return config.status;
            },
            setPopupStyle: function () {
                var style = {
                    'left': custFuncs.addUnit(opts.left),
                    'top': custFuncs.addUnit(opts.top),
                    'right': custFuncs.addUnit(opts.right),
                    'bottom': custFuncs.addUnit(opts.bottom),
                    'width': custFuncs.addUnit(opts.width),
                    'height': custFuncs.addUnit(opts.height),
                    'z-index': config.zIndex
                };

                if(opts.showCenter){
                    style.left = "50%";
                    if(style.top === 'auto'){
                        style.top = "45%";
                    }
                    style.bottom = "auto";
                    style.right= "auto";
                    style.transform = 'translate(-50%, -50%)';
                }

                setStyle(node, style);
            },
            show: function (left, top, right, bottom, callback) {
                if(custFuncs.getStatus()) {
                    if(!config.isShow && !config.hideFinish){
                        config.hideFinish = [].slice.call(arguments, 0);
                        return;
                    }
                    node.classList.add('gently-move');
                    setTimeout(function(){
                        node.classList.remove('gently-move');
                    }, 300);
                    custFuncs.setPosition(left, top, right, bottom);
                    return;
                }
                config.status = true;
                if(opts.overlay.show){
                    Overlay.open(opts.overlay);
                    custFuncs.setTop();
                }
                custFuncs.setPosition(left, top, right, bottom);
                document.body.appendChild(node);
                custFuncs.bindEvent();

                var resolve = function(){
                    config.isShow = true;
                    that.fire('show', {type: 'show'});
                    getType(callback) === 'function' && callback();
                    config.hideFinish = null;
                    if(getType(config.showFinish) === 'array') {
                        var args = config.showFinish;
                        config.showFinish = true;
                        custFuncs.hide.apply(null, args);
                    }else config.showFinish = true;
                };

                if(opts.animate.show){
                    custFuncs.setAnimate(true, opts.animate.duration, function(){
                        resolve();
                    });
                }else{
                    resolve();
                }
            },
            hide: function (callback, state, data) {
                if(custFuncs.getStatus() && !config.showFinish){
                    config.showFinish = [].slice.call(arguments, 0);
                }

                if(!config.isShow || getType(config.showFinish) === 'array') return;

                config.isShow = false;

                var resolve = function(){
                    config.status = config.isShow;
                    custFuncs.unbindEvent();
                    that.fire('hide', {type: "hide", state: state || "close", data: data || {}});
                    getType(callback) === 'function' && callback();
                    document.body.removeChild(node);
                    opts.overlay.show && Overlay.close(opts.overlay);
                    config.showFinish = null;
                    if(getType(config.hideFinish) === 'array') {
                        var args = config.hideFinish;
                        config.hideFinish = true;
                        custFuncs.show.apply(null, args);
                    }else config.hideFinish = true;
                };

                if(opts.animate.show){
                    custFuncs.setAnimate(false, opts.animate.duration, function(){
                        resolve();
                    });
                }else{
                    resolve();
                }
            },
            getNodeList: function(){
                return nodeList;
            }
        };


        custFuncs.initPopup();
        //-----------------暴露各种方法-----------


        that.show = custFuncs.show;
        that.hide = custFuncs.hide;
        that.setFullScreen = custFuncs.setFullScreen;
        that.getStatus = custFuncs.getStatus;
        that.getOverlay = custFuncs.getOverlay;
        that.setTop = custFuncs.setTop;
        that.getNodeList = custFuncs.getNodeList;

        return that;
    };
});