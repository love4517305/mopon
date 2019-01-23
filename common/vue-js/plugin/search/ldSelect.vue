<template>
	<li class="item">
		<span class="m-search-condition" ref="select" :data-select="'type=ld&sign='+mark+'&index='+index+'&id='+id">
			<span class="label">{{label}}</span>
			<span class="m-select condition-content">
				<i class="icon down" node-name="arrowIcon"></i>
				<span class="selected-item border-box" node-name="selectedItem">--请选择{{label}}--</span>
				<select class="hide" :name="name" :data-default-value="value" :data-select-index="selectedIndex" :data-validate="defValidate" node-name="realSelect"></select>
			</span>
		</span>
	</li>
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
            validate: String,
			 value: [String, Number],
            selectIndex: [String, Number],
            sign: String,
			 option: Array
		},
		data () {
            return {
                id: getUniqueId(),
                mark: this.sign.split("_")[0],
                index: this.sign.split("_")[1],
                defValidate: this.validate || "nullText=" + this.label
            }
		},
		mounted () {
            if(!_options[this.mark]){
                _options[this.mark] = [];
            }
            if(isArray(this.option)){
                _options[this.mark] = Object.assign({}, this.option);
            }

            _vueList.push(this);

            this.initSelect();
		},
		methods: {
            initSelect () {
                clearTimeout(_timer);
                _timer = setTimeout(() => {
                    let nodeList = [];
                    _vueList.forEach(item => nodeList.push(item.$refs.select));
                    let m_select = select(nodeList, {
                        options: _options
                    });
                    m_select.init();
                    _vueList.forEach(item => m_select.bind(item.id, item.dropMenu));
                }, 100);
            },
            dropMenu (ev){
                this.$emit('change', ev.data);
			}
		}
    }
</script>