/**
 * Created by TIAN on 2018/11/2.
 */
define(function(require, exports, module) {
    var compBase = require('lib/comp/base');
    var setStyle = require('lib/dom/setStyle');

    return {
        options: [],
        overlay: false,
        open: function (option) {
            if (!option || this.options.indexOf(option) !== -1) return;
            if (this.options.length === 0) {
                this.showOverlay();
            }
            option.zIndex = compBase.getZIndex();
            this.options.push(option);
            this.changeOverlayStyle();
        },
        close: function (option) {
            var index = this.options.indexOf(option);
            if (index === -1) return;
            this.options.splice(index, 1);
            if (this.options.length === 0) {
                this.closeOverlay();
            }
            this.changeOverlayStyle();
        },
        showOverlay: function () {
            this.overlay = document.createElement('DIV');
            this.overlay.classList.add('m-overlay');
            document.body.appendChild(this.overlay);
        },
        closeOverlay: function () {
            var self = this;
            if (!self.overlay) return;
            setStyle(this.overlay, {
                opacity:  0
            });
            setTimeout(function(){
                document.body.removeChild(self.overlay);
                self.overlay = null;
            }, 300);

        },
        changeOverlayStyle: function () {
            if (!this.overlay || this.options.length === 0) return;
            var option = this.options[this.options.length - 1];
            var self = this;
            setTimeout(function(){
                setStyle(self.overlay, {
                    opacity:  option.opacity || 0.4,
                    backgroundColor: option.color || '#000',
                    zIndex: option.zIndex || 1000
                });
            }, 10);
        }
    };
});