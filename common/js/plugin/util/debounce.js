/************
 *防抖动，达成指定条件再执行
 * @param func
 * @param wait
 * @param immediate
 * @returns {Function}
 */
module.exports = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    var later = function() {
        var last = Date.now() - timestamp;
        if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };
    return function() {
        context = this;
        args = arguments;
        timestamp = Date.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }
        return result;
    };
};