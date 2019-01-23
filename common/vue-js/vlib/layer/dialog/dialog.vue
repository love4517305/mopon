<template>
  <div class="mv-dialog-common">
    <div class="header" v-if="myOption.header" ref="header">
      <h3 v-html="myOption.title"></h3>
      <a href="javascript:void(0);" v-if="myOption.close" @click="closeDialog" class="close" title="关闭"></a>
    </div>
    <div class="box" :style="{maxHeight: isMobile ? 'none' : maxHeight, height: !isMobile && myOption.fullScreen ? (parseInt(maxHeight) - 60 + 'px') : null,  maxWidth: isMobile ? 'none' : maxWidth, width: !isMobile && myOption.fullScreen ? maxWidth : null}"><slot></slot></div>
    <div class="footer" v-if="myOption.footer">
      <a href="javascript:void(0)" @click="butClick(item.id, item)" v-for="item in myOption.buts" :class="item.type == 'blue' ? 'm-blue-bg-button' : 'm-white-bg-button'">{{ item.text }}</a>
    </div>
  </div>
</template>
<script>
    import {isArray, isObject } from  'vlib/util/dataType'
    import moveLayer from 'plugin/module/moveLayer'


    export default {
        props: {
            option: {
                type: Object,
                default () {
                    return {};
                }
            },
            buts: Object
        },
        data () {
            return {
                myOption: {
                    header: true,
                    footer: true,
                    close: true,
                    fullScreen: false,
                    title: "提示",
                    buts: []
                },
                moveLayer: null,
                isMobile: !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/),
                maxHeight: window.innerHeight - 150 + "px",
                maxWidth: window.innerWidth - 100 + "px"
            }
        },
        watch: {
            buts (opt) {
                if(opt.type === "add"){
                    this.myOption.buts = this.myOption.buts.concat(opt.buts);
                }else if(opt.type === "del"){
                    if(isObject(opt.buts)){
                        this.myOption.buts = this.myOption.buts.filter(item => item.id !== opt.buts.id);
                    }else if(isArray(opt.buts)){
                        const arr = opt.buts.map(item => item.id);
                        this.myOption.buts = this.myOption.buts.filter(item => arr.indexOf(item.id) === -1);
                    }
                }else if(opt.type === "edit"){
                    if(isObject(opt.buts)){
                        this.myOption.buts = this.myOption.buts.map(item => {
                            if(item.id === opt.buts.id) return Object.assign(item, opt.buts);
                            return item;
                        });
                    }else if(isArray(opt.buts)){
                        const obj = opt.buts.map(item => {
                            return {[item.id]: item};
                        });
                        this.myOption.buts = this.myOption.buts.filter(item => {
                            if(obj[item.id]) return Object.assign(item, obj[item.id]);
                            return item;
                        });
                    }
                }
            }
        },
        mounted () {
            this.$nextTick(() => {
                this.myOption = Object.assign(this.myOption, this.option);
                if(this.$refs.header){
                    this.moveLayer = moveLayer(this.$refs.header, {
                        layer: this.$el.parentNode
                    });
                    this.moveLayer.init();
                }
                this.myOption.fullScreen && !this.isMobile && this.$el.classList.add("mv-dialog-full-screen");
            });
        },
        methods: {
            butClick (key, item) {
                this.$emit("click", {key: key, item: item});
            },
            closeDialog () {
                this.$emit("close");
            }
        }
    }
</script>
<style lang="scss" scoped>
  @import "../../../../js/plugin/scss/static";
  .mv-dialog-common {
    border-radius: 3px;
    background-color: $bg1;
    box-shadow: 0 19px 60px rgba(0,0,0,.298039), 0 15px 20px rgba(0,0,0,.219608);
    overflow: hidden;
    &.mv-dialog-full-screen{
      .v-dialog-grid{
        width: auto !important;
      }
    }
    >.header {
      color: $color3;
      font-size: $fs16;
      position: relative;
      background-color: $bg4;
      height: 50px;
      line-height: 50px;
      padding-left: 16px;
      box-sizing: border-box;
      >.close {
        -moz-appearance: none;
        -webkit-appearance: none;
        //background: rgba(51, 51, 51, .2);
        @include mix-close;
        cursor: pointer;
        display: inline-block;
        /*height: 24px;*/
        /*width: 24px;*/
        position: absolute;
        top: 18px;
        right: 20px;
      }
/*
      >.close:after,
      >.close:before {
        background: $bg6;
        content: "";
        display: block;
        height: 2px;
        left: 50%;
        margin-left: -25%;
        margin-top: -1px;
        position: absolute;
        top: 50%;
        width: 50%;
      }

      >.close:before {
        transform: rotate(45deg);
      }

      >.close:after {
        transform: rotate(-45deg);
      }

      >.close:hover {
        background: rgba(51, 51, 51, .5);
      }*/
    }
    >.box {
      @extend %clearfix;
      border: 1px solid transparent;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 400px;
    }
    .footer {
      text-align: center;
      padding: 9px 0;
      background-color: $bg4;
      a {
        margin: 0 10px;
      }
    }
  }
</style>