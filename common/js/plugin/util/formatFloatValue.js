/**
 * 格式保留指定小数点
 */
define(function() {
    //---------- require begin -------------
    //---------- require end -------------
    function formatNumber(v, pos, bool) {
        if (!/^(-?\d+)\.?\d*$/.test(v) || pos <= 0) return v;
        else if(bool) return Math.round(v * Math.pow(10, pos)) / Math.pow(10, pos);
        else if (/^(-?\d+)$/.test(v)) {
            return v + "." + new Array(pos + 1).join("0");
        } else {
            var r = Math.round(v * Math.pow(10, pos)) / Math.pow(10, pos);
            if (/^(-?\d+)$/.test(r)) {
                return r + "." + new Array(pos + 1).join("0");
            }
            var arr = (r + "").match(/\.\d+/);
            var len = arr ? arr[0].length - 1 : 0;
            if (len == pos) {
                return r;
            } else {
                return r + new Array(pos + 1 - len).join("0");
            }
        }
    };

    return formatNumber;
});