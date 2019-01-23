<template>
  <transition :name="myAnimate.name"
              @before-enter="myAnimate.beforeEnter"
              @enter="myAnimate.enter"
              @leave="myAnimate.leave"
              @after-enter="afterEnter"
              @after-leave="afterLeave"
              :css="true">
    <div v-show="isShow" class="m-popup" :style="setStyle">
      <div class="progress-bar" v-if="myProgressBar.show && myProgressBar.showTime > 0">
        <div class="bar" :style="setTime" :class="control"></div>
      </div>
    </div>
  </transition>
</template>
<script>
    import OverlayManager from 'vlib/layer/overlay'
    import { getUniqueId, getZIndex, fire, bind, unbind } from 'vlib/comp/bus'
    import scrollPos from 'vlib/util/scrollPos'
    import contains from 'vlib/dom/contains'
    import getSize from 'vlib/util/getSize'
    import {isString, isNumber, isFunction, isUndefined, isObject, isArray, isNode } from  'vlib/util/dataType'
    import delay from 'vlib/util/delay'
    import Vue from 'vue'

    export default {
        name: "popup",
        props: {
            fixed: {
                type: Boolean,
                default: false
            },
            top: {
                type: String,
                default: "40%"
            },
            left: {
                type: String,
                default: "20%"
            },
            right: {
                type: String,
                default: "auto"
            },
            bottom: {
                type: String,
                default: "auto"
            },
            width: {
                type: String,
                default: "auto"
            },
            height: {
                type: String,
                default: "auto"
            },
            progressBar: {
                type: Object,
                default () {
                    return {}
                }
            },
            overlay: {
                type: Object,
                default () {
                    return {}
                }
            },
            escHide: {
                type: Boolean,
                default: false
            },
            autoHide: {
                type: Boolean,
                default: false
            },
            showCenter: {// 显示的时候保持居中
                type: Boolean,
                default: false
            },
            animate: {
                type: Object,
                default () {
                    return {}
                }
            }
        },
        mounted () {
            this.showPromise = new Promise((resolve) => {
                this.$nextTick(() => {
                    this.myOverlay = Object.assign(this.myOverlay, this.overlay, {overlayClick: this.get("overlayClick")});
                    this.myProgressBar = Object.assign(this.myProgressBar, this.progressBar);
                    this.myAnimate = Object.assign(this.myAnimate, this.animate);
                    resolve();
                });
            });
        },
        data () {
            return {
                zIndex: getZIndex(),
                isShow: false,
                status: false,
                control: '',
                tempHTML: null,
                delay: delay(),
                showFinish: null,
                hideFinish: null,
                showPromise: null,
                hidePromise: null,
                animateShowResolve: null,
                animateHideResolve: null,
                insertNode: document.body,
                myAnimate: {
                    name: "scale",
                    beforeEnter: function(){},
                    enter: function(){},
                    leave: function(){},
                    custom: false
                },
                myOverlay: {
                    show: true,
                    color: '',
                    opacity: ''
                },
                myProgressBar: {
                    show: false,
                    color: '#6AEE00',
                    opacity: 1,
                    showTime: 0//默认显示时间0秒,不自动关闭
                },
                busId: {},
                child: []
            }
        },
        computed: {
            setStyle () {
                return {
                    'position': this.fixed ? 'fixed' : '',
                    'left': this.left,
                    'top': this.top,
                    'right': this.right,
                    'bottom': this.bottom,
                    'width': this.width,
                    'height': this.height,
                    'z-index': this.zIndex
                }
            },
            setTime () {
                return {
                    'transition': `all ${this.myProgressBar.showTime}s linear`,
                    'background': this.myProgressBar.color
                }
            }
        },
        methods: {
            createHTML (html) {
                let box = this.$el;
                if(isString(html)){
                    box.innerHTML = html;
                    let nodes = [].slice.call(box.querySelectorAll("[ref]"));
                    let ref = this.$refs;
                    nodes.forEach(item => {
                        let name = item.getAttribute("ref");
                        item.removeAttribute("ref");
                        let res = ref[name];
                        if(res){
                            if(isArray(res)){
                                ref[name].push(item);
                            }else{
                                ref[name] = [res, item];
                            }
                        }else{
                            ref[name] = item;
                        }
                    });
                }else if(isNode(html)){
                    box.appendChild(html);
                }
            },
            vue (html, opts) {
                let node = document.createElement("DIV");
                this.$el.appendChild(node);
                opts.template = html;
                opts.store = this.$store;
                let Content = Vue.extend(opts);
                return new Content().$mount(node);
            },
            addUnit (value){
                return /\d$/.test(value) ? value + "px" : value;
            },
            bindEvent () {
                this.delay.append(self => {
                    self.autoHide && window.addEventListener('click', self.autoClickHide);
                    self.escHide && window.addEventListener("keyup", self.escPress);
                }, 10, this);
            },
            unbindEvent () {
                this.autoHide && window.removeEventListener('click', this.autoClickHide);
                this.escHide && window.removeEventListener("keyup", this.escPress);
            },
            autoClickHide (evt) {
                if(contains(this.$el, evt.target)) return;
                this.hide(null, "auto");
            },
            escPress (ev) {
                if (ev.keyCode === 27) { // ESC
                    this.hide(null, "esc");
                }
            },
            afterEnter () {
                this.animateShowResolve();
            },
            afterLeave () {
                this.animateHideResolve();
            },
            useProgress () {
                if (this.myProgressBar.showTime > 0) {
                    if (this.myProgressBar.show) {
                        this.delay.append(self => {
                            self.control = "progress-leave";
                        }, 30, this);
                    }
                    this.delay.append((self, state) => {
                        self.hide(null, state);
                    }, this.myProgressBar.showTime * 1000, this, "time");
                }
            },
            initProgress () {
                this.myProgressBar.show && (this.control = "");
            },
            get (key) {
                if(this.busId[key]){
                    return this.busId[key];
                }else{
                    this.busId[key] = getUniqueId();
                }
                return this.busId[key];
            },
            pushMessage (fn) {
                isFunction(fn) && this.child.push(fn);
            },
            postMessage (option){//通讯模块
                this.child.forEach(fn => fn(option));
            },
            setTop (index) {
                this.zIndex = isNumber(index) ? index: getZIndex();
            },
            setMiddle (left, top) {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const size = getSize(this.$el);
                const pos = scrollPos();
                const format = function(total, value){
                    if(/^\d+$/.test(parseInt(value))){
                        if(/%$/.test(value)) {
                            return total * parseInt(value) / 100;
                        }else{
                            return parseInt(value);
                        }
                    }
                    return value;
                };
                const x = (isNumber(left) || isString(left) ? format(screenWidth, left) : (screenWidth - size.width) / 2) + pos.left;
                const y = (isNumber(top) || isString(top) ? format(screenHeight, top) : (screenHeight - size.height) / 2) + pos.top;
                this.setPosition(Math.max(0, x), Math.max(0, y));
            },
            setAniCenter (left, top) {
                this.$el.classList.add("gently-move");
                this.delay.append(() => {
                    this.$el.classList.remove("gently-move");
                }, 300);
                this.setMiddle(left, top);
            },
            setFullScreen (horizontal = false, vertical = false) {
                if(horizontal){
                    this.width = this.addUnit(window.innerWidth);
                }else{
                    this.width = "auto";
                }
                if(vertical){
                    this.height = this.addUnit(window.innerHeight);
                }else{
                    this.height = "auto";
                }
            },
            setPosition (left, top, right, bottom){
                !isUndefined(left) && (this.left = this.addUnit(left));
                !isUndefined(top) && (this.top = this.addUnit(top));
                !isUndefined(right) && (this.right = this.addUnit(right));
                !isUndefined(bottom) && (this.bottom = this.addUnit(bottom));
            },
            setLayout (left, top, right, bottom) {
                this.showCenter && this.setMiddle(left, top);
                !this.showCenter && this.setPosition(left, top, right, bottom);
            },
            getOverlay () {
                return OverlayManager.overlay;
            },
            getStatus () {
                return this.status;
            },
            destroy () {
                fire(this.get("destroy"), {type: "destroy"});
                this.$destroy();
            },
            bind (type, fn) {
                isFunction(fn) && bind(this.get(type), fn);
            },
            unbind (type, fn) {
                isFunction(fn) && unbind(this.get(type), fn);
            },
            fire (type, opts) {
                fire(this.get(type), opts);
            },
            initModule (left, top, right, bottom) {
                return new Promise(resolve => {
                    this.$el.classList.add("popup-module-init");
                    fire(this.get("popup.init"), {type: "init"});
                    this.delay.append(() => {
                        this.$el.classList.remove("popup-module-init");
                        this.setLayout(left, top, right, bottom);
                        resolve();
                    }, 10);
                });
            },
            setInsertNode (node) {
                if(isNode(node)){
                    this.insertNode = node;
                }else{
                    this.insertNode = document.body;
                }
            },
            show (left, top, right, bottom, callback) {
                if(this.getStatus()) {
                    if(!this.isShow && !this.hideFinish){
                        this.hideFinish = [...arguments];
                        return;
                    }
                    this.$el.classList.add("gently-move");
                    this.delay.append(() => {
                        this.$el.classList.remove("gently-move");
                    }, 300);
                    this.setLayout(left, top, right, bottom);
                    return;
                }
                this.status = true;
                this.showPromise.then(() => {
                    if(this.myOverlay.show){
                        OverlayManager.open(this.myOverlay);
                        this.setTop();
                    }
                    this.insertNode.appendChild(this.$el);
                    this.initModule(left, top, right, bottom)
                        .then(() => {
                            this.delay.append(self => {
                                self.isShow = true;
                                self.bindEvent();
                                self.useProgress();
                            }, 10, this);
                        });
                });
                new Promise((resolve) => {
                    this.animateShowResolve = resolve;
                }).then(() => {
                    fire(this.get("show"), {type: "show", self: this});
                    isFunction(callback) && callback();
                    this.animateShowResolve = null;
                    this.hideFinish = null;
                    if(isArray(this.showFinish)) {
                        const args = this.showFinish;
                        this.showFinish = true;
                        this.hide.apply(this, args);
                    }else this.showFinish = true;
                });
                this.hidePromise = new Promise((resolve) => {
                    this.animateHideResolve = resolve;
                });

            },
            hide (callback, state, data) {
                if(this.getStatus() && !this.showFinish){
                    this.showFinish = [...arguments];
                }
                if(!this.isShow || isArray(this.showFinish)) return;
                this.isShow = false;
                this.delay.cancel();
                this.unbindEvent();
                this.hidePromise.then(() => {
                    fire(this.get("hide"), {type: "hide", state: state || "close", data: data || {}});
                    isFunction(callback) && callback();
                    this.initProgress();
                    this.insertNode.removeChild(this.$el);
                    this.status = this.isShow;
                    this.myOverlay.show && OverlayManager.close(this.myOverlay);
                    this.animateHideResolve = null;
                    this.showFinish = null;
                    if(isArray(this.hideFinish)) {
                        const args = this.hideFinish;
                        this.hideFinish = true;
                        this.show.apply(this, args);
                    }else this.hideFinish = true;
                });
            }
        }
    }
</script>
<style lang="scss" scoped>
  .m-popup {
    position: absolute;
    left: 0;
    top: 0;
    &.gently-move{
      transition: all .3s linear;
    }
    &.popup-module-init{
      opacity: 0 !important;
      display: block !important;
    }
  }
  .slide-enter-active,.slide-leave-active,
  .slide-left-enter-active,.slide-left-leave-active,
  .slide-top-enter-active,.slide-top-leave-active,
  .slide-right-enter-active,.slide-right-leave-active,
  .slide-bottom-enter-active,.slide-bottom-leave-active,
  .fade-enter-active,.fade-leave-active,
  .scale-enter-active,.scale-leave-active{
    transition: all .3s linear;
  }
  .scale-enter,.scale-leave-to {
    transform: scale(0.5) !important;
    opacity: 0.5 !important;
  }
  .fade-enter,.fade-leave-to {
    opacity: 0 !important;
  }
  .slide-enter {
    transform: translateY(-100%) !important;
    opacity: 0 !important;
  }
  .slide-leave-to {
    transform: translateY(100%) !important;
    opacity: 0 !important;
  }
  .slide-left-enter,.slide-left-leave-to {
    transform: translateX(-200%) !important;
  }
  .slide-top-enter,.slide-top-leave-to {
    transform: translateY(-200%) !important;
  }
  .slide-right-enter,.slide-right-leave-to {
    transform: translateX(200%) !important;
  }
  .slide-bottom-enter,.slide-bottom-leave-to {
    transform: translateY(200%) !important;
  }

  .progress-bar {
    width: 100%;
    height: 2px;
    z-index: 1000;
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
    .bar{
      width: 100%;
      background: #000;
      height: 2px;
      transform: translateZ(0);
      &.progress-leave {
        transform: translate3d(-100%, 0, 0);
      }
    }
  }


</style>
