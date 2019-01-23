<template>
    <div class="m-tree-box"></div>
</template>
<script>
    import tree from 'plugin/module/mTree'

    export default {
        name: "tree",
        props: {
            options: Object,
            data: [Array, Object]
        },
        mounted () {
            this.tree = tree(this.$el, this.options);
            this.tree.init();
            this.data && this.tree.addTreeItems(this.data);
        },
        watch: {
            data (val) {
                this.tree.addTreeItems(val);
            }
        },
        methods: {

        }

    }
</script>
<style lang="scss">

</style>