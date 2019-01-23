<template>
    <div class="m-grid-page"></div>
</template>
<script>
    import page from 'plugin/module/page'

    export default {
        name: "page",
        props: {
            options: Object,
            totalRows: [Number, String],
            curPage: [Number, String]
        },
        mounted () {
            this.page = page(this.$el, this.options);
            this.page.init();
            this.page.bind("page", this.page);
            this.totalRows && this.page.updatePage(this.totalRows);
            this.curPage && this.page.setCurPage(this.curPage);
        },
        watch: {
            totalRows (v) {
                this.page.updatePage(v);
            },
            curPage (v) {
                this.page.updatePage(v);
            }
        },
        methods: {
            page (opt) {
                this.$emit("change", opt.data);
            }
        }

    }
</script>
<style lang="scss">

</style>