<template>
    <div class="m-popup-alert" :class="'alert-'+type">
        <i class="close" @click="close" title="关闭"></i>
        <div class="title" v-if="type == 'err'">提示</div>
        <i :class="type"></i>
        <span class="text" v-html="msg"></span>
    </div>
</template>
<script>
    export default {
        props: ["msg", "type"],
        methods: {
            close () {
                this.$emit("close");
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .m-popup-alert{
        width: 332px;
        min-height: 104px;
        background-color: $bg1;
        border-radius: 5px;
        position: relative;
        line-height: 104px;
        box-shadow: 0 0 3px rgba(0,0,0,0.1);
        &.alert-err{
            line-height: 0;
            .title{
                font-size: $fs16;
                color: $color3;
                height: 36px;
                line-height: 48px;
                text-indent: 64px;
            }
            .text{
                font-size: $fs12;
                line-height: 20px;
                padding-top: 10px;
            }
            .err{
                vertical-align: top;
            }
        }
        .close{
            @include mix-close;
            position: absolute;
            right: 12px;
            top: 12px;
            cursor: pointer;
        }
        .suc{
            @include mix-let-dialog-suc;
            margin: 0 15px;
            vertical-align: middle;
        }
        .err{
            @include mix-dialog-err;
            margin: 0 15px;
        }
        .text{
            font-size: $fs16;
            color: $color3;
            display: inline-block;
            width: 245px;
            word-break: break-all;
            line-height: 24px;
        }
    }
</style>