<template>
    <div class="m-draw-canvas-hover">
        {{text}}
    </div>
</template>
<script>
    export default {
        props: [],
        mounted () {
            this.$message(this.modText);
        },
        data () {
            return {
                text: ""
            }
        },
        methods: {
            modText (text){
                this.text = text;
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .m-draw-canvas-hover{
        min-width: 120px;
        max-width: 220px;
        background: $bg6;
        background-color: rgba($bg39, 0.4);
        @include radius(5px);
        padding: 5px 12px 5px 5px;
        font-size: $fs12;
        font-weight: bold;
        color: $color1;
        line-height: 22px;
        word-break: break-all;
    }
</style>