<template>
    <div class="mg-win-wait"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
</template>
<script>
    export default {
        props: []
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";

    .mg-win-wait {
        width: 100px;
        height: 100px;
        background-color: rgba($bg39, 0.5);
        @include radius(8px);
        box-shadow: 0 19px 60px rgba(0,0,0,.298039), 0 15px 20px rgba(0,0,0,.219608);
        .text{
            @include center;
            font-size: $fs12;
            color: $color20;
            @include animation(fade 5s ease infinite);
        }
        span{
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: $bg1;
            position: absolute;
            @include animation(pageLoading 1.04s ease infinite);
        }
        span:nth-child(1){
            left: 15px;
            top: 50%;
            margin-top:-4px;
            @include animation-delay(0.13s);
        }
        span:nth-child(2){
            left: 29px;
            top: 29px;
            @include animation-delay(0.26s);
        }
        span:nth-child(3){
            left: 50%;
            top: 15px;
            margin-left: -4px;
            @include animation-delay(0.39s);
        }
        span:nth-child(4){
            top: 29px;
            right: 29px;
            @include animation-delay(0.52s);
        }
        span:nth-child(5){
            right: 15px;
            top: 50%;
            margin-top:-4px;
            @include animation-delay(0.65s);
        }
        span:nth-child(6){
            right: 29px;
            bottom: 29px;
            @include animation-delay(0.78s);
        }
        span:nth-child(7){
            bottom: 15px;
            left: 50%;
            margin-left: -4px;
            @include animation-delay(0.91s);
        }
        span:nth-child(8){
            bottom: 29px;
            left: 29px;
            @include animation-delay(1.04s);
        }
    }

    @include keyframes(pageLoading){
        0%{
            opacity: 0.2;
            @include scale(0.3);
        }
        100%{
            opacity: 1;
            @include scale(1.2);
        }
    }
    @include keyframes(fade){
        0%{
            opacity: 0;
        }
        50%{
            opacity: 1;
        }
        100%{
            opacity: 0;
        }
    }
</style>