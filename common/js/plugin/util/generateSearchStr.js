/**
生成导出文件时所需的参数：searchStr(用来在导出后的文件中显示查询条件)
 **/
//----------------require--------------
module.exports = function(obj, map) {
	var str = '';
	for (var key in obj) {
		if (str != '' && str.lastIndexOf(',') != str.length -1) {
			str += ',';
		}
		if (key == 'searchStartTime') {
			str = str + '开始时间: ' + obj[key];
		}
		if (key == 'searchEndTime') {
			str = str + '结束时间: ' + obj[key];
		}
		if (key == 'issueType') {
			str = str + '发布界面: ' + map.issueType[obj[key]];
		}
		if (key == 'groupID') {
			str = str + '所属分组: ' + map.groupID[obj[key]];
		}
		// if (key == 'positionID') {
		// 	str = str + '所属位置: ' + map.positionID[obj[key]];
		// }
		// if (key == 'contentID') {
		// 	str = str + '内容: ' + map.contentID[obj[key]];
		// }
		if (key == 'visitDate') {
			var dates = obj[key].split(',');
			for (var i = 0; i < dates.length; i++) {
				str = str + '日期: ' + dates[i];
			}
		}
		if (key == 'salesPlanName') {
			str = str + '营销计划名称：' + obj[key];
		}
		if (key == 'planPerson') {
			str = str + '计划提交人：' + obj[key];
		}
	}

	if (str.lastIndexOf(',') == str.length -1) {
		str = str.slice(0, str.length - 1);
	}

	str = str ? '搜索条件: ' + str : '搜索条件: 无';

	return str;
};