/**
 * Created by TIAN on 2018/7/25.
 */
var queryToJson = require('lib/json/queryToJson');

module.exports = function () {
    return queryToJson(location.hash.split('?')[1] || '');
}