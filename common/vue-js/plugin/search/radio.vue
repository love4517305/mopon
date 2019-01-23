<template>
    <li class="item">
        <span class="m-search-condition">
            <span class="label" v-if="label">{{label}}</span>
            <span class="condition-content radio">
                <label v-for="(v, k) in data"><input :disabled="disabled" :value="k" @change="change({val:k,name:name})" v-model="defaultValue" :name="name" :data-validate="defValidate" type="radio"/>&nbsp;{{v}}</label>
            </span>
		</span>
    </li>
</template>
<script>
    export default {
        props: {
            label: String,
            name: String,
            value: [String, Number],
            validate: String,
            data:[Object,Array],
            disabled:[Boolean, String],
            defaultValue:[Boolean, String]
        },
        data () {
            return {
                defaultValue: this.value,
                defValidate: this.validate || "nullText=" + this.label
            }
        },
        methods:{
            change(data){
                this.$emit("change",data)
            }
        }
    }
</script>
<style lang="scss">

</style>