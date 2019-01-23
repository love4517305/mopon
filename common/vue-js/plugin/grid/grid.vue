<template>
    <div class="m-grid"></div>
</template>
<script>
    import grid from 'plugin/module/grid'

    export default {
        name: "grid",
        props: {
            options: Object,
            data: [Array, Object],
            page: {
                type: Object,
                default () {
                    return {}
                }
            },
            isLoad: {
                type: Boolean,
                default: true
            },
            isInit: {
                type: Boolean,
                default: true
            }
        },
        data () {
            return {
                gridPage: {curPage: 1, totalRows: 0}
            }
        },
        mounted () {
            this.gridPage = Object.assign({}, this.gridPage, this.page || {});
            this.grid = grid(this.$el, this.options);
            this.isInit && this.init();
            this.grid.bind("page", this.next);
        },
        watch: {
            data () {
                if(this.grid.getInitStatus()){
                    this.grid.addRows(this.data);
                }
            },
            isInit (bool) {
                if(bool && !this.grid.getInitStatus()){
                    this.init();
                }
            },
            page (opt) {
                this.grid.updatePage(opt.totalRows, opt.curPage);
            }
        },
        methods: {
            next (opt) {
                this.$emit("change", {
                    pageNum: opt.data.curPage,
                    pageSize: opt.data.pageSize
                });
            },
            init () {
                this.grid.init(true);
                if(this.isLoad){
                    this.grid.addRows(this.data, "数据加载中，请稍候...");
                }else{
                    this.grid.addRows(this.data);
                }
                this.grid.updatePage(this.gridPage.totalRows, this.gridPage.curPage);
            }
        }

    }
</script>
<style lang="scss">

</style>