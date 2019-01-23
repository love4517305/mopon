<template>
    <section class="m-search-wrap m-vue-search">
        <ul class="search-items" node-name="items" ref="items">
            <slot></slot>
        </ul>
        <div class="search-but" node-name="searchBut">
            <span class="m-more-condition-btn hide" node-name="moreBtn">
                <span>更多</span><span class="more" node-name="more" data-type="hide"><span class="icon-more"></span></span>
            </span>
            <span class="m-search-btn" node-name="search">搜索</span>
        </div>
    </section>
</template>
<script>
    import searchBase from "plugin/module/searchBase"

    export default {
        props: ["auto"],
        data () {
            return {
                search: null,
                timer: null
            }
        },
        mounted () {
            this.timer = setInterval(() => {
                if(this.$refs.items.innerText !== ""){
                    this.initSearch();
                    clearInterval(this.timer);
                }
            }, 10);
        },
        methods: {
            listenCalendar (opt) {
                this.$emit("calendar", opt.data);
            },
            initSearch () {
                this.search = searchBase(this.$el);
                this.search.init();
                this.search.bind("search", this.searchResult);
                if(this.auto){
                    this.search.search();
                }
                let calendar = this.search.getCalendar();
                if(calendar){
                    calendar.bind("click", this.listenCalendar);
                }
            },
            setSize () {
                this.search && this.search.setSize();
            },
            searchResult (evt){
                this.$emit("search", evt.data.conditions);
            }
        }
    }
</script>
<style lang="scss">

</style>