<template>
    <input v-if="layer" class="u-calendar" :value="value"  readonly="readonly" :disabled='disabled' :name="name" :title="'请选择' + label" :placeholder="'请选择' + label" type="text"/>
    <div v-else class="u-calendar" :value="value"></div>
</template>
<script>
    import calendar from 'plugin/module/calendar'

    export default {
        props: {
            label: String,
            name: String,
            value: String,
            option: {
                type: Object,
                default: {}
            },
            disabled: {//是否禁用
                type: Boolean,
                default: false
            }, 
            layer: {
                type: Boolean,
                default: true
            }
        },
        mounted () {
            // calendar(this.$el, this.option);
            if (!this.calendar) {
                this.option.layer = this.layer;
                this.calendar = calendar(this.$el, this.option);
            }
            this.calendar.bind("click", this.change);
        },
        methods: {
            change(evt){
                let value = this.option.timeDetail ? evt.data.timeDetail : evt.data.value;
                //this.$emit("input", value);
                this.$emit('change', {
                    node: this.$el,
                    value: value
                });
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .u-calendar{
        background-image: img-url("icons/date");
        background-position: 95% center;
        background-repeat: no-repeat;
    }
</style>