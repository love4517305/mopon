<template>
    <ul class="m-checkbox-group" v-if="data">
        <li class="all" v-if="all"><label><input type="checkbox" @click="allCheck" v-model="isCheckAll"><span>全选</span></label></li>
        <li v-for="(item, key) in data">
            <label>
                <input :value="key" :name="name" :title="'请选择' + label" @click="change" v-model="checkboxData" type="checkbox">
                <span :title="item">{{item}}</span>
            </label>
        </li>
    </ul>
</template>
<script>
    import {isUndefined, isNull} from 'vlib/util/dataType'
    export default {
        model: {
          event: 'change'
        },
        props: {
            all: {
                type: Boolean,
                default: true
            },
            label: {
                type:String,
                default: ''
            },
            name: String,
            value: {
                type: [Number, String, Array]
            },
            data: {
               type: [Object, Array],
               required: true
            }
        },
        data () {
            return {                
                checkboxData:(isUndefined(this.value) || isNull(this.value) ) ? [] : [].concat(this.value),
                defaultData: this.initData()
            }
        },
        computed: {
            isCheckAll () {
                return this.checkboxData.length == this.defaultData.length;
            }
        },
        watch: {
            value () {
                this.checkboxData = [].concat(this.value)
            }
        },
        methods: {
            change () {
                this.$emit("change", this.checkboxData);
            },
            initData () {
                let arr = [];
                for(let k in this.data){
                    arr.push(k);
                }
                return arr;
            },
            allCheck (ev) {
                this.checkboxData = ev.target.checked ? this.defaultData : [];
                this.$emit("change", this.checkboxData);
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .m-checkbox-group{
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
