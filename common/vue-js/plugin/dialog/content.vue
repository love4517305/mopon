<template>
    <div class="mv-dialog-alert">
        <span :class="option.icon == 'suc' ? 'icon-dialog-suc' : 'icon-dialog-err'"></span>
        <span class="text">{{ option.msg }}</span>
    </div>
</template>
<script>
    export default {
        props: {
            option: {
                type: Object,
                default () {
                    return {};
                }
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .mv-dialog-alert {
        font-size: $fs16;
        color: $color3;
        text-align: center;
        width: 390px;
        line-height: 162px;
        .text{
            display: inline-block;
            max-width: 340px;
            word-break: break-all;
            text-align: left;
            line-height: 24px;
            font-size: 16px;
        }
    }
    .icon-dialog-suc,.icon-dialog-err{
        vertical-align: middle;
        margin-right: 7px;
    }
    .icon-dialog-suc{
        @include mix-let-dialog-suc;
    }
    .icon-dialog-err{
        @include mix-dialog-err;
    }
</style>
