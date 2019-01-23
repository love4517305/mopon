/**********
 * 获取字符长度
 * @param str
 * @returns {Number}
 */
export default function(str) {
    return (str || "").replace(/[^\x00-\xff]/g, "aa").length;
}