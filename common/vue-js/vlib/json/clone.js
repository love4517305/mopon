/**
 * 复制json对象，保证修改后不影响原来的对象
 * 例子：
 *
 * var clone = require("../json/clone");
 * var obj = { id: 1 };
 * var objNew = clone(obj); // 修改objNew不会涉及到obj
 *
 */

import {isObject, isArray } from '../util/dataType'

function clone (json) {
    let obj = null;
    if(isArray(json)){
        obj = [];
        json.forEach(item => {
           obj.push(clone(item));
        });
    }else if(isObject(json)){
        obj = {};
        for(let key in json){
            obj[key] = clone(json[key]);
        }
    }else{
        return json;
    }
    return obj;
}

export default clone;
