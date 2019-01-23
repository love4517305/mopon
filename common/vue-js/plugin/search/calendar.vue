<template>
    <li class="item">
        <span class="m-search-condition">
			<span class="label">{{label}}</span>
			<span class="condition-container">
				<span class="condition-content">
					<input readonly="readonly" class="vue-date" :value="value" node-name="calendar" :data-type="showDay ? 1 : 0" type="text" :name="name" :data-validate="defValidate"/>
				</span>
			</span>
        </span>
    </li>
</template>
<script>
    export default {
        props: {
            label: String,
            name: String,
            validate: String,
            value: String,
            showDay: {
                type: Boolean,
                default: true
            }
		},
        data () {
            return {
                defValidate: this.validate || "select=true&nullText=" + this.label
            }
        }
    }
</script>
<style lang="scss">

</style>