<template>
    <section class="v-dialog-form">
        <div class="m-tab-title">基础设置</div>
        <ul class="items-box">
            <li class="item double" v-for="(item, index) in ticketList" :key="index">
                <input type="hidden" name="key" :value="item.key">
                <span class="name">{{item.val}}</span>
                <span class="input-box">
                    <view-select name="print" label="打印机" :hint="false" :value="option.defaultConfig[item.key]" :selectIndex="0" :data="option.lists.printList"></view-select>
                </span>
            </li>
            <!-- 读卡器配置 -->
            <li class="item double" style="clear:both;" key="readerCode">
                <input type="hidden" name="key" value="readerCode">
                <span class="name">可用读卡器</span>
                <span class="input-box">
                    <view-select name="print" label="可用读卡器" :hint="false" :value="option.defaultConfig['readerCode']" :selectIndex="0" :data="option.lists.readerList"></view-select>
                </span>
            </li>
            <li class="item double" key="portCode">
                <input type="hidden" name="key" value="portCode">
                <span class="name">可用端口号</span>
                <span class="input-box">
                    <view-select name="print" label="可用端口号" :hint="false" :value="option.defaultConfig['portCode']" :selectIndex="0" :data="option.lists.portList"></view-select>
                </span>
            </li>
        </ul>
    </section>
</template>
<script>
    import form from 'vlib/form/form'
    import dialogManager from 'vs/plugin/dialog'
    export default {
        props: ["option"],
        data () {
            return {
                checked: 1,
                ticketList: []
            }
        },
        mounted () {
            console.log(this.option.lists);
            this.$message(this.print);
            this.form = form();
        },
        methods: {
            dialogShow () {
                this.loadTicketTemp();
            },
            loadTicketTemp () {
                this.$http.wait.post("/proxy/base/base/dicAction/queryDicByType", {type: "templateType"})
                    .then(res => {
                        let arr = [];
                        res.data.forEach(item => {
                            arr.push({key: item.value, val: item.name});
                        });
                        this.ticketList = arr;
                        this.$nextTick(() => {
                            this.$popupCenter();
                        });
                    }).catch(res => {
                    dialogManager.error(res.msg);
                });
            },
            print () {
                this.form.resetForm(this.$el);
                let result = this.form.getFormData();
                console.log(result);
                let arr1 = [].concat(result.key);
                let arr2 = [].concat(result.print);
                let obj = {};
                arr1.forEach((v, i) => {
                    obj[v] = arr2[i];
                });
                this.$emit("send", obj);
            }
        }
    }
</script>
<style lang="scss" scoped>
    .v-dialog-form{
        width: 900px;
        padding: 30px 0;
        .items-box{
            padding-top: 10px;
        }
    }
</style>