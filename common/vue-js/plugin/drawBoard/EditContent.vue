<template>
    <section class="v-dialog-form">
        <ul class="items-box">
            <li class="item" v-if="option.items">
                <span class="name"><em>*</em>关联场区</span>
                <span class="input-box">
                    <view-select label="关联场区" :value="option.coord" :data="option.items" @change="dropSelect"></view-select>
                </span>
            </li>
            <li class="item" v-else>
                <span class="name"><em>*</em>关联场区</span>
                <span class="input-box"><input :value="option.coord" ref="coord" type="text" placeholder="请输入坐标"/></span>
            </li>
            <li class="item">
                <span class="name">名称</span>
                <span class="input-box"><input :value="option.text" ref="text" type="text" placeholder="请输入名称"/></span>
            </li>

            <li class="item">
                <span class="name">备注</span>
                <span class="input-box"><input :value="option.desc" ref="desc" type="text" placeholder="请输入备注"/></span>
            </li>
        </ul>
    </section>
</template>
<script>
    import dialogManager from 'vs/plugin/dialog'

    export default {
        props: ["option"],
        mounted () {
            this.$message(this.submit);
        },
        data () {
            return {
                coord: "",
                name: ""
            }
        },
        methods: {
            submit () {
                let text = this.$refs.text.value.trim();
                let bool = !!this.$refs.coord;
                let coord = bool ? this.$refs.coord.value.trim() : this.coord;
                let desc = this.$refs.desc.value.trim();
                if(coord === ""){
                    dialogManager.toast("请"+(bool ? "输入" : "选择")+"关联场区！");
                }else{
                    this.$emit("send", {text: text, coord: coord, desc: desc, name: this.name === "" ? coord : this.name});
                }
            },
            dropSelect (opt){
                this.coord = opt.key;
                this.name = opt.val;
            }
        }
    }
</script>
<style lang="scss" scoped>
    .v-dialog-form{
        width: 600px;
        margin: 30px 0;
        .item{
            .name{
                width: 80px;
            }
            .input-box{
                input,.m-select{
                    width: 400px;
                }
            }
        }
    }
</style>