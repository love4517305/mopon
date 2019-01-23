/**
 * @author 璩
 * @data 2017-05-12
 * @description 表单异步提交
 */

module.exports = function(opts) {
    //----------------require--------------
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var merge = require("lib/json/merge");

    //-----------声明模块全局变量-------------
    opts = merge({
        "url": "",
        "timeout": 30 * 1000,
        "data": {},
        "onSuccess": function() {},
        "onError": function() {},
        "method": "post",
        "type": "json" // "text/json/xml"
    }, opts || {});

    opts.method = opts.method.toLocaleLowerCase() == "get" ? "get" : "post";
    var timer = null;

    var createNode = function(name, theme){
        var node = document.createElement(name);
        if(theme){
            each(theme, function(v, k){
                node.style[k] = v;
            });
        }
        return node;
    }

    var frame = createNode("iframe", {
        position: "absolute",
        top: "-99999px",
        left: "-99999px"
    });
    frame.src = "javascript:false";
    frame.name = "frame_upload";
    document.body.appendChild(frame);

    var fileForm = createNode("form");
    fileForm.method = opts.method;
    fileForm.action = opts.url;
    fileForm.enctype = "multipart/form-data";
    document.body.appendChild(fileForm);

    var getFrameHTML = function(io) {
        var text = "";
        try {
            if (io.contentWindow) {
                text = io.contentWindow.document.body ? io.contentWindow.document.body.children[0].innerHTML : null;
                if (io.contentDocument) {
                    text = io.contentDocument.document.body ? io.contentDocument.document.children[0].innerHTML : null;
                }
            }
        }
        catch (e) {
        }
        return text;
    };

    var callback = function(){
        clearTimeout(timer);
        var res = getFrameHTML(frame);
        if(res != null && res.indexOf("</pre>") != -1){
            res = res.replace("<pre>", "").replace("</pre>", "");
        }
        try{
            res = (new Function("return " + res))();
            opts.onSuccess(res);
        }catch(ex){
            opts.onError(res);
        }
        document.body.removeChild(frame);
        document.body.removeChild(fileForm);
    };

    if(getType(opts.data) == "object"){
        each(opts.data, function(v, k){
            var input = createNode("input");
            input.type = "hidden";
            input.value = v;
            input.name = k;

            input.setAttribute("multiple", "multiple");
            fileForm.appendChild(input);
        });
    }

    frame.onload = callback;
    fileForm.target = "frame_upload";
    fileForm.submit();

    timer = setTimeout(function(){
        frame.onload = null;
        callback = null;
        document.body.removeChild(frame);
        document.body.removeChild(fileForm);
        opts.onError({error: "-1", msg: "请求超时！"});
    }, opts.timeout);
};