<template>
    <ul class="v-context-menu">
        <li @click="dropSelect('edit')">关联场区</li>
        <li @click="dropSelect('del')">删除</li>
    </ul>
</template>
<script>
    export default {
        props: [],
        methods: {
            dropSelect (type) {
                this.$emit("select", type);
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .v-context-menu {
        width: 120px;
        background-color: $bg1;
        box-shadow: 2px 2px 10px rgba($bg39, 0.4);
        border-radius: 5px;
        overflow: hidden;
        li {
            line-height: 36px;
            font-size: $fs14;
            color: $color3;
            text-indent: 8px;
            cursor: pointer;
            border-bottom: 1px solid $border13;
            &:hover {
                background-color: $bg3;
            }
        }
    }
</style>