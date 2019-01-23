<template>
	<span class="m-select condition-content" :data-select="'type=ld&sign='+mark+'&index='+index+'&id='+id">
		<i class="icon down" node-name="arrowIcon"></i>
		<span class="selected-item border-box" :class="{disabled: disabled}" node-name="selectedItem">--请选择{{label}}--</span>
		<select class="hide" :name="name" :data-default-value="value" :data-select-index="selectedIndex" node-name="realSelect"></select>
	</span>
</template>
<script>
    import select from "plugin/module/ldSelect"
    import {isUndefined, isObject, isArray} from 'vlib/util/dataType'
    import {getUniqueId} from 'vlib/comp/bus'
    let _options = {};
    let _timer = null;
    let _vueList = [];

    export default {
        props: {
            label: String,
            name: String,
            disabled: {//是否禁用
                type: Boolean,
                default: false
            },
            value: [String, Number],
            selectIndex: [String, Number],
            sign: String,
            option: Array
        },
        data () {
            return {
                id: getUniqueId(),
                mark: this.sign.split("_")[0],
                index: this.sign.split("_")[1]
            }
        },
		watch: {
          	option (v) {
                _options[this.mark] = Object.assign({}, v);
                this.initSelect();
			}
		},
        mounted () {
            _vueList.push(this);

            if(!_options[this.mark]){
                _options[this.mark] = [];
            }
            if(isArray(this.option) && this.option.length > 0){
                _options[this.mark] = Object.assign({}, this.option);
                this.initSelect();
            }
        },
        methods: {
            initSelect () {
                clearTimeout(_timer);
                _timer = setTimeout(() => {
                    let nodeList = [];
                    _vueList.forEach(item => nodeList.push(item.$el));
                    let m_select = select(nodeList, {
                        options: _options
                    });
                    m_select.init();
                    _vueList.forEach(item => {
                        item.ldSelect = m_select;
                        m_select.bind(item.id, item.dropMenu);
					});
                }, 100);
            },
            dropMenu (ev){
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