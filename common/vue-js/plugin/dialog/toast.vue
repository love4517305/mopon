<template>
    <div class="m-dialog-toast">
        {{msg}}
    </div>
</template>
<script>
    export default {
        props: ["msg"]
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .m-dialog-toast {
        padding: 15px 25px;
        font-size: $fs14;
        color: $color1;
        min-width: 120px;
        background-color: rgba($bg39, 0.8);
        border-radius: 5px;
    }
</style>