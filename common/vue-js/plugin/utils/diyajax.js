import ajax from 'vlib/io/ajax'
import {isObject } from 'vlib/util/dataType'

ajax.create({
    timeout: 20000
});

// code状态码200判断
ajax.response.use((res, isWait) => {
    if(isWait === true){
        top.$vueDialog.closeWait();
    }
    if (res.status === 654) { // 百度云请求超时检测
        console.log('请求超时！');
        return Promise.reject({type: -1, status: 654, msg: "请求超时！", res: res});
    }
    if (parseInt(res.data.code) !== 0) {
        console.log('暂无数据！');
        return Promise.reject({type: 0, status: 200, msg: res.data.msg, res: res.data});
    }
    return res.data;
}, (res, isWait) => {
    if(isWait === true){
        top.$vueDialog.closeWait();
    }
    console.error('promise error:' + res.msg);
    if(res.status === 401){
        if(top.$vueDialog){
            top.$vueDialog.toast("超时未操作，请重新登录！")
                .then(() => {
                    window.top.location.href = "./login.html";
                });
        }else{
            return Promise.reject({type: -2, status: res.status, msg: "超时未操作，请重新登录！"});
        }
        return;
    }
    return Promise.reject({type: -2, status: res.status, msg: isObject(res.data) ? (res.data.msg || "请求出错！") : res.msg, res: res.data});
});

ajax.request.use((res, isWait) => {
    if(isWait === true){
        top.$vueDialog.wait();
    }
    return res;
});


export default ajax;
