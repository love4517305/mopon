/************
 * 遮罩层
 * 璩小孩 20170801
 */
import Vue from 'vue'
import overlay from './overlay.vue';
import { getZIndex, bind, fire } from 'vlib/comp/bus'

const OverlayManager = {
    options: [],
    overlay: false,
    isMobile: !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/),
    open (option) {
        if (!option || this.options.indexOf(option) !== -1) return;
        if (this.options.length === 0) {
            this.showOverlay();
        }
        option.zIndex = getZIndex();
        this.options.push(option);
        this.changeOverlayStyle();
    },
    close (option) {
        let index = this.options.indexOf(option);
        if (index === -1) return;
        this.options.splice(index, 1);
        if (this.options.length === 0) {
            this.closeOverlay();
        }
        this.changeOverlayStyle();
    },
    showOverlay () {
        const vm = new Vue({
            el: document.createElement("DIV"),
            template: '<overlay ref="overlay"/>',
            components: { overlay }
        });
        this.overlay = vm.$refs.overlay;
        bind(this.overlay.get("overlayClick"), this.handlerOverlayClick.bind(this));
        this.overlay.show();
        if(!this.isMobile){
            this.bodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
    },
    closeOverlay () {
        if (!this.overlay) return;
        if(!this.isMobile){
            document.body.style.overflow = this.bodyOverflow;
        }
        this.overlay.hide();
        this.overlay = null;
    },
    changeOverlayStyle () {
        if (!this.overlay || this.options.length === 0) return;
        const option = this.options[this.options.length - 1];
        this.overlay.setStyle(option);
    },
    handlerOverlayClick () {
        if (this.options.length === 0) return;
        const option = this.options[this.options.length - 1];
        fire(option.overlayClick, option);
    }
};

export default OverlayManager;
