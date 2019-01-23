<!-- 用法
<search-time-scope name="timeScope" ref="timeScope" @change="changeHandler"></search-time-scope>

组件暴露值说明：'30天' => 30; '60天' => 60; '已过期' => ''; 自定义 => [起始天, 结束天数]

获取值1：绑定change事件获取
changeHandler (v) { console.log(v) }

获取值2：调用组件方法手动获取
this.$refs.timeScope.getValue()
 -->
<template>
    <li class="item m-time-scope">
            <span class="label">{{label}}</span>
            <span class="navs label">
                <span class="nav-item" :class="{active: i == activeIdx}" v-for="(v, i) in navs" :key="i" @click="selected(i)">{{v}}</span>
            </span>
            <span class="label">
                <span class="custom-btn" :class="{active: activeIdx == -1}" @click="selected(-1)">自定义</span>
                <span v-show="activeIdx == -1">
                    <span class="input-wrap">
                        <input ref="input" v-model="start" type="text" @blur="blurHandler"/>
                        <span class="suffix">天</span>
                    </span>
                    <span class="division">至</span>
                    <span class="input-wrap">
                        <input ref="input" v-model="end" type="text" @blur="blurHandler"/>
                        <span class="suffix">天</span>
                    </span>
                </span> 
            </span>
            <!-- <input type="hidden" :name="name" v-model="curValue" data-validate=""> -->
    </li>
</template>
<script>
    export default {
        props: {
            label:{
                type: String,
                default: '剩余时间'
            }
            // name: {
            //     type: String,
            //     required: true
            // }
        },
        data () {
            return {
                activeIdx: -1,
                start: '',
                end: '',
                navs: ['30天', '60天', '已过期'],
            }
        },
        mounted () {
        },
        computed: {
            curValue () {
               let obj = {};               
               if(this.activeIdx == -1) {
                   obj = [this.start, this.end];
               } else {
                   obj = this.activeIdx == 0? 30 : this.activeIdx == 1? 60 : '';
               }

               this.$emit('change', obj);

               return obj; 
            }
        },
        watch: {
            start (v) {
                if(!/^\d+$/.test(v)) this.start = "";
            },
            end (v) {
                if(!/^\d+$/.test(v)) this.end = "";
            }
        },
        methods: {
            selected (v) {
                this.activeIdx = v; 
            },
            blurHandler (e) {   //截止天数不能大于起始天数
                if(this.end*1 > 0 && this.start*1 > this.end*1) this.end = this.start;
            },
            getValue () {   //组件外部可通过该方法获取当前值
                return this.curValue;
            }
        }
    }
</script>
<style lang="scss" scoped>
    .m-time-scope {
        line-height: 32px; 
         span {
            display: inline-block;
         }
         .label {
            margin-right: 15px;
         }
    }
    .navs {
        border: 1px solid #e3e4e9;
        .nav-item {
            padding: 0 10px;            
            border-radius: 2px;
            cursor: pointer;
            position: relative;
            top: -1px;

            + .nav-item {
                border-left: 1px solid #e3e4e9;
            }

            &.active {
                background: #6761f5;
                color: #fff;
                border-radius: 0;
            }
        }
    }
    .custom-btn {
        height: 32px;
        line-height: 30px;
        padding: 0 10px;
        font-size: 13px;
        border: 1px solid #e3e4e9;
        color: #333;
        border-radius: 2px;
        cursor: pointer;

        &.active {
            border-color: #6777fc;
            color: #fff;
            background: #6761f5;
        }
    }
    .division {
        padding: 0 10px;
    }
    .input-wrap {
        width: 60px;
        height: 32px;
        position: relative;
        border: 1px solid #e3e4e9;
        border-radius: 3px;

        input {
            width: 34px;
            line-height: 28px;
            padding-left: 4px;
            text-align: center;
            position: relative;
            top: -1px;
        }

        .suffix {
            position: absolute;
            right: 0;
            top: 0;
            padding: 0 4px;
        }
    }
</style>