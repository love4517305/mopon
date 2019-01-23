/**
 * Json转化为Excel并且下载
 * 例子：
 *
 *          var opts = {
 *          	 name: "文件名字"
 *               columns:[
 *               	[
 *               	    {display: "原押金(元)", name: "originalAmount"},
 *               	    {display: "充值金额(元)", name: "amount"},
 *               	    {display: "充值后押金额(元)", name: "depositAmount"},
 *               	    {display: "操作时间", name: "rechargeTime"},
 *               	    {display: "操作人", name: "operator"}
 *               	],
 *               	[
 *               	    {display: "原押金(元)", name: "originalAmount"},
 *               	    {display: "充值金额(元)", name: "amount"},
 *               	    {display: "充值后押金额(元)", name: "depositAmount"},
 *               	    {display: "操作时间", name: "rechargeTime"},
 *               	    {display: "操作人", name: "operator"}
 *               	]
 *               ],
 *               names:["excelXXXX","excelXXX1"]
 *               datas:[
 *               	[
 *               		{originalAmount:"aaa",amount:"bbb"},
 *               		{originalAmount:"aaa",amount:"bbb"}
 *               	],
 *               	[
 *               		{originalAmount:"aaa",amount:"bbb"},
 *               		{originalAmount:"aaa",amount:"bbb"}
 *               	]
 *               ]
 *           }
 */
var jszip = require("./jszip.min")
var xlsx = require("./xlsx");
var saveAs = require("./FileSaver");
var each = require("lib/util/each")

module.exports = function(opts) {
	var data = []
		each(opts.names, function (item, index) {
			var obj = {}
			var keys = []
			obj.name = item
			obj.header = []
			each(opts.columns[index], function (v, i) {
				obj.header.push(v.display)
				keys.push(v.name)
			})
			obj.content = []
			each(opts.datas[index], function (v, i) {
				var data = []
				each(keys, function (name) {
					data.push(v[name])
				})
				obj.content.push(data)
			})
			data.push(obj)
		})
        var file = new xlsx.File();
        data.forEach(item => {
            var sheet = file.addSheet(item.name)
            var row = sheet.addRow();
            for (let i = 0; i < item.header.length; i++) {
                var cell = row.addCell();
                cell.value = item.header[i];
            }
            for (let i = 0; i < item.content.length; i++){
                var row = sheet.addRow();
                for(let j =0 ;j < item.content[i].length; j++){
                    var cell = row.addCell();
                    cell.value = item.content[i][j];
                }
            }
        })
        file
          .saveAs('blob')
          .then(content => {
            saveAs(content, opts.name + ".xlsx");
        });
}

		
