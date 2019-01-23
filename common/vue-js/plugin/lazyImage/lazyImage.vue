<template>
<img :style="style" :src="initSrc != '' ? initSrc : defaultImg"/>
</template>
<script>
    const string = {type: String, default: ""};
    export default {
        props: {
            src: string,
            initSrc: string,
            errorSrc: string,
            scale: string,
            autoDestroy: {//是否自动销毁
                type: String,
                default: true
            }
        },
        data () {
            return {
                defaultImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi/v//PwNAgAEACQsDAUdpTjcAAAAASUVORK5CYII=',
                img: null,
                style: {},
                cdn: ""
            }
        },
        mounted () {
            this.loadImage();
        },
        watch: {
            src () {
                this.loadImage();
            }
        },
        methods: {
            cdnUrl (src) {
                if(!/^(\/common\/images)/.test(src)) return src;
                return this.cdn + src;
            },
            setSrc (src) {
                this.$el.src = this.cdnUrl(src);
                this.$emit("load", src);
            },
            setPos () {
                if(!/^\d+\.?\d*$/.test(this.scale)) return;
                if(this.img.width / this.img.height > this.scale){
                    this.style = {width: "auto", height: "100%"};
                }else{
                    this.style = {width: "100%", height: "auto"};
                }
            },
            loadImage () {
                if(this.src === "" || this.src === null){
                    this.err();
                    return;
                }
                this.img = new Image();
                this.img.src = this.src;
                if (this.img.complete) {
                    this.suc();
                } else {
                    this.img.onload = this.suc;
                    this.img.onerror = this.err;
                }
            },
            suc () {
                this.setSrc(this.src);
                this.setPos();
                this.$emit("suc", {src: this.src, width: this.img.width, height: this.img.height});
                this.destroy();
            },
            err () {
                if(this.errorSrc !== ""){
                    this.setSrc(this.errorSrc);
                }else{
                    this.setSrc(this.defaultImg);
                }
                this.$emit("err", {src: this.src});
                this.destroy();
            },
            destroy () {
                if(!this.autoDestroy) return;
                this.img = null;
                this.$destroy();
            }
        }
    }
</script>