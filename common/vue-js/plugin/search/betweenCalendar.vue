<template>
    <li class="item">
        <span class="m-search-condition">
			<span class="label">{{label}}</span><span class="condition-container">
				<span class="condition-content">
					<input readonly="readonly" node-name="calendar" type="text" :name="startName" :value="startValue" :data-validate="startValidate"/>
					<i class="icon-date"></i>
				</span>
			</span><span>到</span><span class="condition-container">
				<span class="condition-content">
					<input readonly="readonly" node-name="calendar" type="text" :name="endName"  :value="endValue"  :data-validate="endValidate"/>
					<i class="icon-date"></i>
				</span>
			</span>
        </span>
    </li>
</template>
<script>
    export default {
        props: {
            label: String,
            startValue: String,
            endValue: String,
            startName: {
                type: String,
                default: "startDate"
            },
            endName: {
                type: String,
                default: "endDate"
            },
            startValidate: {
                type: String,
                default: "select=true&nullText=起始时间"
            },
            endValidate: {
                type: String,
                default: "select=true&nullText=结束时间"
            }
		}
    }
</script>