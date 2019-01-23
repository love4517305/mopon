<template>
    <span :class="'m-'+icon+'-btn'" @click="clickBtn">
        <span class="icon"></span><span><slot></slot></span>
    </span>
</template>
<script>
    export default {
        props: {
            icon: {
                type: String,
                default: "blue"
            }
        },
        methods: {
            clickBtn () {
                this.$emit("click");
            }
        }
    }
</script>