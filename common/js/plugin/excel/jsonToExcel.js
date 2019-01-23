/**
 * Json转化为Excel并且下载
 * 例子：
 *
 *          var opts = {
 *               option:[
 *                   {display: "原押金(元)", name: "originalAmount"},
 *                   {display: "充值金额(元)", name: "amount"},
 *                   {display: "充值后押金额(元)", name: "depositAmount"},
 *                   {display: "操作时间", name: "rechargeTime"},
 *                   {display: "操作人", name: "operator"}
 *               ],
 *               name:"excelXXXX"
 *               data:[{originalAmount:"aaa",amount:"bbb"},{originalAmount:"aaa",amount:"bbb"}]
 *           }
 */
var jsonToExcel = require("../tmpl/jsonToExcel.ejs");
var formatDate = require("../util/formatDate");

module.exports = function(opts) {
    opts.data = opts.data||[];

    var uri = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(jsonToExcel(opts));

    var link = document.createElement("a");
    link.href = uri;

    link.style = "visibility:hidden";
    link.download = opts.name||formatDate(new Date(), 'yyyy-MM-dd') + ".xls";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
