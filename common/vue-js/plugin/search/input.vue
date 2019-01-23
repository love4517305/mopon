<template>
    <li class="item">
        <span class="m-search-condition">
            <span class="label">{{label}}</span>
            <span class="condition-content"><input ref="input" :disabled="disabled" :value="value" :name="name" :data-validate="defValidate" type="text"/></span>
		</span>
    </li>
</template>
<script>
    export default {
        props: {
            label: String,
            name: String,
            validate: String,
            placeholder: String,
            value:[String,Number],
            disabled:[Boolean,String]
        },
        data () {
            return {
                defValidate: this.validate || "nullText=" + (this.placeholder || this.label)
            }
        }
    }
</script>
<style lang="scss">

</style>