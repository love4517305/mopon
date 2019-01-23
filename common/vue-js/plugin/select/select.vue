<template>
	<span class="m-select condition-content">
		<i class="icon down" node-name="arrowIcon"></i>
		<span class="selected-item border-box" :class="{disabled: disabled}" node-name="selectedItem">--请选择{{label}}--</span>
		<select class="hide" :name="name" :data-default-value="value" :data-select-index="selectIndex" node-name="realSelect"></select>
	</span>
</template>
<script>
    import select from "plugin/module/dropmenu"

    export default {
        props: {
            label: String,
            name: String,
            value: [String, Number],
            selectIndex: [String, Number],
            data: [Object, Array],
            disabled: {//是否禁用
                type: Boolean,
                default: false
            },
            hint: {//是否有提示
                type: Boolean,
                default: true
            }
        },
		data () {
            return {
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
                this.select = select(this.$el, {
                    showPromptText: this.hint,
                    promptText: this.label ? '--请选择'+this.label+'--' : '--请选择--'
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
<style lang="scss" scoped>
	@import "../../../js/plugin/scss/static";
	.m-select{
		@include simple-input(200px, 34px, false);
		padding: 0;
		.icon{
			top: 15px;
		}
		.selected-item {
			line-height: 34px;
			@include radius(3px);
			padding: 0 10px;
			&.disabled{
				&:hover {
					border: 1px solid $border3;
				}
				&:focus {
					border: 1px solid $border3;
				}
			}
			&:hover {
				border: 1px solid rgba($border9, 0.7);
			}
			&:focus {
				border: 1px solid $border9;
			}
		}
	}
</style>
<style lang="scss">
	.m-select-menu{
		li{
			height: 34px !important;
			line-height: 34px !important;
		}
	}
</style>