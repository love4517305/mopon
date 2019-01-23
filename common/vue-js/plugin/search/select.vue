<template>
	<li class="item">
		<span class="m-search-condition" ref="select">
			<span class="label">{{label}}</span>
			<span class="m-select condition-content">
				<i class="icon down" node-name="arrowIcon"></i>
				<span class="selected-item border-box" node-name="selectedItem">--请选择{{label}}--</span>
				<select class="hide" :name="name" :data-default-value="value" :data-select-index="selectIndex" :data-validate="defValidate" node-name="realSelect"></select>
			</span>
		</span>
	</li>
</template>
<script>
    import select from "plugin/module/dropmenu"

    export default {
        props: {
            label: String,
            validate: String,
            name: String,
            value: [String, Number],
            selectIndex: [String, Number],
            data: [Object, Array],
            hint: {//是否有提示
                type: Boolean,
                default: true
            }
		},
		data () {
            return {
                defValidate: this.validate || "nullText=" + this.label,
                select: null
            }
		},
		watch: {
            data () {
                this.loadData();
            },
            value () {
                this.setDefaultValue();
            }
		},
		mounted () {
            this.initSelect();
		},
		methods: {
            initSelect () {
                this.select = select(this.$refs.select, {
                    showPromptText: this.hint
                });
                this.select.bind("dropMenuChosed", this.dropMenuChosed);
                this.select.init();
                this.data && this.loadData();
            },
            setDefaultValue () {
                try {
                    this.select.setDefaultValue(true, this.value, this.selectIndex);
                }catch(e){
                    console.log("数据出错:" + e.message)
                }
            },
            loadData () {
                try {
                    this.select.loadData({
                        selectMenuData: {
                            "selectItems": this.data || {}
                        }
                    });
                } catch (e) {
                    console.log("数据出错:" + e.message)
                }
            },
            dropMenuChosed (ev){
                this.$emit('input', ev.data.key);
                this.$emit('change', ev.data);
			}
		}
    }
</script>