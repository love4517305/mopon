<template>
    <ul class="m-radio-group" v-if="data">
        <li v-for="(item, key) in data">
            <label>
                <input :value="key" :disabled="disabled" v-model="radioText" :name="name" :title="'请选择' + label" type="radio">
                <span>{{item}}</span>
            </label>
        </li>
    </ul>
</template>
<script>
    export default {
        props: {
            label: {
                type:String,
                default: ''
            },
            disabled:{
                type:[Boolean,String],
                default:false
            },
            name: String,
            value: [String,Number],
            data: [Object, Array]
        },
        data () {
            return {
                radioText: this.value
            }
        },
        watch: {
            value (v) {
                this.radioText = v;
            },
            radioText () {
                this.$emit('input', this.radioText);
                this.$emit("change", this.radioText);
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .m-radio-group{
        @extend %clearfix;
        float: left;
        font-size: $fs14;
        padding-top: 10px;
        &.auto{
            li{
                width: auto;
                padding-right: 15px;
            }
        }
        .all{
            float: none;
        }
        li {
            float: left;
            line-height: 24px;
            width: 130px;
            @extend %ellipsis-basic;
            input {
                vertical-align: middle;
            }
            label {
                cursor: pointer;
                padding: 0 8px;
                span {
                    padding-left: 8px;
                }
            }
            padding-right: 5px;
        }
    }
</style>