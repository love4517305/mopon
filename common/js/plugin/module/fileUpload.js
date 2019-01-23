/**
 * @author 璩
 * @data 2016-07-21
 * @description 文件上传
 */

module.exports = function(node, opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var runtime = require("plugin/runtime"); // 运行时相关代码
    var each = require("lib/util/each");
    var getType = require("lib/util/getType");
    var addEvent = require('lib/evt/add');
    var setStyle = require("lib/dom/setStyle");
    var getPosition = require("lib/dom/getPosition");
    var className = require("lib/dom/className");
    var merge = require("lib/json/merge");
    var preventDefault = require("lib/evt/preventDefault");
    var fireEvent = require("lib/evt/fire");
    var isNode = require("lib/dom/isNode");
    var clone = require("lib/json/clone");

    //-----------声明模块全局变量-------------
    var nodeList = {}; // 存储所有关键节点
    var that = base();
    var data = null;
    var xhr = null;
    var fileIndex = 0;
    var fileset = {};
    var cacheMap = {};
    var timer = null;
    var isHandCancel = null;
    var prepareUpload = null;
    var uploadFile = null;
    var cancelUploadItems = {};
    var pos = {};
    var modules = [];

    /*******
     * 警告提示
     */
    var warnMsg = {
        1: "当前正在上传中，请上传完后再上传其它文件!",
        2: "文件格式为##name##的不符合！",
        3: "请上传##name##格式的文件！",
        4: "文件上传出错！",
        5: "文件上传被取消！",
        6: "没有文件！",
        7: "上传文件不能大于##name##MB！",
        8: "操作失败！"
    };

    var defaults = {
        url: "",
        dataType: "json",
        fileName: "myfile",
        formats: null,//上传格式jpg,png,gif....
        form: false,
        bindForm: null,
        createForm: true,
        base64: false,
        multiple: true,//多文件上传
        preview: true,//预览
        maxSize: 100,//单个文件最多100M
        maxCount: 9,//最多一次上传9个文件
        data: null,//参数
        clear: true,//是否清除文件
        drop: null,//拖拉上传
        disabled: false,//是否禁用上传,boolean类型
        realTime: true,//即时上传
        onChange: function(){},
        onBefore: function(){return true;}//两个参数，一个data,另一个文件数量
    };
    opts = merge(defaults, opts || {});
    //-------------事件响应声明---------------
    var evtFuncs = {
        fileChange: function(){
           if(xhr.readyState == 1){
               that.fire("warn", {data: opts.data, msg: warnMsg[1], key: 1});
               return;
           }else if(opts.disabled) return;
            prepareUpload = false;
            var files = nodeList.fileInput.files;
            if(files){
                var len = files.length;
                var error = [];
                if(!opts.onBefore(opts.data, len)) return;
                var count = 0;
                for(var i = 0;i < len; i++){
                    var file = files[i];
                    if(!opts.formats || custFuncs.verifyFormat(file.name, opts.formats)){
                        fileset["_file_" + fileIndex] = {file: file, type: file.type, index: fileIndex};
                        fileIndex++;
                        count++;
                    }else{
                        error.push(custFuncs.getFormat(file.name));
                    }
                }
                if(count != len){
                    that.fire("warn", {data: opts.data, msg: warnMsg[2].replace("##name##", error.join(",")), key: 2});
                }
                if(count == 0){
                    nodeList.fileInput.value = "";
                    return;
                }
                fileset.count += count;
            }else{
                if(opts.formats && custFuncs.verifyFormat(nodeList.fileInput.value, opts.formats)){
                    that.fire("warn", {data: opts.data, msg: warnMsg[3].replace("##name##", opts.formats), key: 3});
                    nodeList.fileInput.value = "";
                    return;
                }
                fileset.count = 1;
            }

            opts.onChange(opts.data, clone(fileset));
            that.fire("change", {data: opts.data, files: clone(fileset)});

            if(opts.preview){
                custFuncs.multiplePreview();
            }else{
                prepareUpload = true;
            }

            opts.realTime && custFuncs.runUpload();
        },
        uploadProgress: function(evt){
            if (evt.lengthComputable && uploadFile != null && !isHandCancel) {
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                that.fire("progress", {loaded: evt.loaded, total: percentComplete+"%", fileIndex: uploadFile.index});
            }
        },
        uploadComplete: function(evt){
            if(uploadFile == null) return;
            that.fire("success", {data: opts.data, result: custFuncs.callback(evt.target), node: node, fileIndex: uploadFile.index});
            uploadFile = null;
            if(opts.clear) nodeList.fileInput.value = "";
            !isHandCancel && custFuncs.multipleUpload();
        },
        uploadFailed: function(evt){
            that.fire("warn", {msg: warnMsg[4], key: 4});
        },
        uploadCanceled: function(evt){
            isHandCancel && that.fire("warn", {msg: warnMsg[5], key: 5});
        },
        uploadCallback: function(){
            var result = custFuncs.getFrameHTML(nodeList.frame);
            that.fire("success", {data: opts.data, result: custFuncs.callback({responseText: result}), fileIndex: 0});
            if(opts.clear) nodeList.fileInput.value = "";
            document.body.removeChild(nodeList.frame);
            delete nodeList.frame;
            if(getType(nodeList.inputs) == "array"){
                each(nodeList.inputs, function(item){
                    nodeList.fileForm.removeChild(item);
                });
            }
            that.fire("finish", {data: opts.data, msg: "上传完成！"});
        },
        mouseMove: function(e){
            if(opts.disabled) return;
            var offset = getPosition(node);
            var _top = offset.top;
            var _left = offset.left;
            var moveX = e.pageX || e.clientX + document.body.scrollTop - document.body.clientTop;
            var moveY = e.pageY || e.clientY + document.body.scrollLeft - document.body.clientLeft;
            var maxW = pos.nodeWidth;
            var maxH = pos.nodeHeight;
            var x = moveX - _left;
            var y = moveY - _top;
            if(x >= 0 && x <= maxW && y >= 0 && y <= maxH){
                var h = pos.fileHeight;
                var w = pos.fileWidth;
                setStyle(nodeList.fileDiv, {
                    top: (y - h / 2) + "px",
                    left: (x - w / 2) + "px"
                });
            }else{
                setStyle(nodeList.fileDiv, {
                    top: "0px",
                    left: "0px"
                });
            }
        },
        preventDefault: function(evt){
            preventDefault(evt);
        },
        handleDrop: function(evt){
            // 获取拖拽的文件列表
            var file = evt.dataTransfer.files[0];
            if(!file) return;
            preventDefault(evt);
            if(opts.formats){//格式限制
                if(!custFuncs.verifyFormat(file.name, opts.formats)){
                    that.fire("warn", {msg: warnMsg[3].replace("##name##", opts.formats), key: 3});
                    return;
                }
            }
            if(!opts.onBefore(opts.data, 1)) return;
            if(opts.preview) {//图片的时候
                custFuncs.imagePreview({file: file, index: 0, type: file.type}, true);
            }
            custFuncs.H5FileUpload({file: file, type: file.type, index: 0});
        },
        readyStateChange: function(){
            if(xhr.readyState == 4 && xhr.status != 200){
                //console.log("请求[" + opts.url + "]失败，状态码为" + xhr.status);
                that.fire("error", {data: opts.data, msg: "上传失败，状态码为" + xhr.status, fileName: uploadFile.file.name, fileIndex: uploadFile.index});
                uploadFile = null;
                if(opts.clear) nodeList.fileInput.value = "";
                !isHandCancel && custFuncs.multipleUpload();
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function() {}

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(xhr.upload, "progress", evtFuncs.uploadProgress);
        addEvent(xhr, "load", evtFuncs.uploadComplete);
        addEvent(xhr, "error", evtFuncs.uploadFailed);
        addEvent(xhr, "abort", evtFuncs.uploadCanceled);
        addEvent(xhr, "readystatechange", evtFuncs.readyStateChange);
        addEvent(nodeList.fileInput, "change", evtFuncs.fileChange);
        addEvent(node, "mousemove", evtFuncs.mouseMove);
        nodeList.drop && addEvent(nodeList.drop, "dragenter", evtFuncs.preventDefault);
        nodeList.drop && addEvent(nodeList.drop, "dragover", evtFuncs.preventDefault);
        nodeList.drop && addEvent(nodeList.drop, "drop", evtFuncs.handleDrop);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        getPreviewFinish: function(){
            if(prepareUpload) return true;
            var finish = true;
            each(fileset, function(obj){
                if(getType(obj) == "object" && !obj.show){
                    finish = false;
                    return false;
                }
            });
            return finish;
        },
        runUpload: function(){
            var bindFlat = true;
            if(modules.length != 0){
                each(modules, function(mod){
                    var file = mod.getFileOuter();
                    if(file.obj || file.node.value != ""){
                        bindFlat = false;
                    }
                });
            }

            if(nodeList.fileInput.value == "" && fileset.count == 0 && bindFlat){
                that.fire("warn", {data: opts.data, msg: warnMsg[6], file: false, key: 6});
                return;
            }
            if(isHandCancel){
                custFuncs.continueUpload();
            }
            clearInterval(timer);
            timer = setInterval(function(){
                if(custFuncs.getPreviewFinish()){
                    clearInterval(timer);
                    custFuncs.asyncFileUpload();
                }
            }, 50);
        },
        continueUpload: function(){
            isHandCancel = false;
            each(cancelUploadItems, function(item){
                that.fire("progress", {loaded: 1, total: "100%", fileIndex: item});
                delete cancelUploadItems[item];
            });
        },
        asyncFileUpload: function(){/*****文件上传******/
            if(opts.url == "") return;
            else if(opts.disabled) return;
            if("FileReader" in window && !opts.form){//支持H5
                custFuncs.multipleUpload();
                return;
            }
            var frame = custFuncs.createNode("iframe", {
                position: "absolute",
                top: "-99999px",
                left: "-99999px"
            });
            frame.src = "javascript:false";
            frame.name = "frame_upload";
            document.body.appendChild(frame);
            if(getType(opts.data) == "object"){
                nodeList.inputs = [];
                each(opts.data, function(v, k){
                    var input = custFuncs.createNode("input");
                    input.type = "hidden";
                    input.value = v;
                    input.name = k;
                    nodeList.inputs.push(input);
                    nodeList.fileForm.appendChild(input);
                });
            }
            nodeList.frame = frame;
            addEvent(frame, "load", evtFuncs.uploadCallback);
            nodeList.fileForm.target = "frame_upload";
            nodeList.fileForm.submit();
            fileset.count = 0;
        },
        multiplePreview: function(){
            if("FileReader" in window){
                each(fileset, function(obj){
                    if(getType(obj) == "object" && !obj.show) {
                        obj.show = true;
                        custFuncs.imagePreview(obj);
                    }
                });
                if(!opts.clear){
                    cacheMap = merge(cacheMap, clone(fileset));
                }
            }else{
                custFuncs.imagePreview(null);
            }
        },
        imagePreview: function(obj, drop){//图片预览
            if("FileReader" in window && obj){//HTML5预览
                if(/\image/.test(obj.type)){//HTML5预览
                    var reader = new FileReader();
                    reader.readAsDataURL(obj.file);
                    reader.onload = function(e){
                        that.fire("preview", {data: opts.data, type: "image", result: this.result, name: obj.file.name, fileIndex: obj.index});
                    }
                }else{
                    that.fire("preview", {data: opts.data, type: obj.type, name: obj.file.name, fileIndex: obj.index});
                }
            }else if(custFuncs.verifyFormat(nodeList.fileInput.value, "jpeg,jpg,png,gif")){
                //通过滤镜显示
                nodeList.fileInput.select();
                nodeList.fileInput.blur();
                var filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='scale',src='" + document.selection.createRange().text + "')";
                that.fire("preview", {data: opts.data, type: "filter", filter: filter, fileIndex: 0, name: getFileInfo().fileName});
                prepareUpload = true;
            }else{//展示
                var fileInfo = custFuncs.getFileInfo();
                that.fire("preview", {data: opts.data, type: "other", fileIndex: 0, name: fileInfo.fileName, format: fileInfo.format});
                prepareUpload = true;
            }
            if(drop) prepareUpload = true;
        },
        getFileInfo: function(){
            var value = nodeList.fileInput.value;
            if(value != ""){
                var end = value.substr(value.lastIndexOf(".") + 1).toLowerCase();
                var index = value.lastIndexOf(".");
                var name = value;
                if(index != -1){
                    name = value.substr(index + 1).toLowerCase();
                }
                return {fileName: name, format: end};
            }
            return {};
        },
        getFormat: function(name){
            return name.lastIndexOf(".") != -1 ? name.substr(name.lastIndexOf(".") + 1, name.length).toLowerCase() : "";
        },
        verifyFormat: function(el, ex){//上传文件类型
            var ext = el.lastIndexOf(".") == -1 ? el.split("/") ? el.split("/")[1] : "" : el.substr(el.lastIndexOf(".") + 1, el.length).toLowerCase(),
                re = new RegExp("(^|\\s|,)" + ext + "($|\\s|,)", "ig"),result = true;
            if(ex != "" && (re.exec(ex) == null || ext == "")) result = false;
            return result;
        },
        multipleUpload: function(){
            if(fileset.count <= 0){
                if(opts.clear) nodeList.fileInput.value = "";
                that.fire("finish", {data: opts.data, msg: "上传完成！"});
                return;
            }
            for(var key in fileset){
                var r = fileset[key];
                if(getType(r) == "object"){
                    delete fileset[key];
                    fileset.count --;
                    custFuncs.H5FileUpload(r);
                    break;
                }
            }
        },
        getFileSize: function(file){//获取文件大小
            if(typeof opts.maxSize === "string" && opts.maxSize.match(/kb/i)){
                return parseFloat(Math.round(file.size * 100 / 1024) / 100);
            }else{
                return parseFloat(Math.round(file.size * 100 / (1024 * 1024)) / 100);
            }


        },
        fileBase64: function(fn){
            var files = nodeList.fileInput.files;
            if(files && getType(fn) == "function"){
                var reader = new FileReader();
                reader.readAsDataURL(files[0]);
                reader.onload = function(){
                    fn(this.result);
                }
            }
        },
        H5FileUpload: function(obj){
            if(custFuncs.getFileSize(obj.file) > parseFloat(opts.maxSize)){
                if(typeof opts.maxSize === "string" && opts.maxSize.match(/kb/i)){
                    that.fire("warn", {data: opts.data, msg: warnMsg[7].replace("##name##MB", (parseFloat(opts.maxSize) + "KB")), key: 7});
                }else{
                    that.fire("warn", {data: opts.data, msg: warnMsg[7].replace("##name##", parseFloat(opts.maxSize)), key: 7});
                }
                return;
            }
            uploadFile = obj;
            if(cancelUploadItems){
                custFuncs.continueUpload();
            }
            var fd = new FormData();

            if("object" == getType(opts.data)){
                each(opts.data, function(v, k){
                    fd.append(k, v);
                });
            }

            if(opts.base64){
                var reader = new FileReader();
                reader.readAsDataURL(obj.file);
                reader.onload = function(e){
                    fd.append(opts.fileName, this.result, obj.file.name);
                    xhr.open("POST", opts.url);
                    xhr.send(fd);
                }
            }else {
                fd.append(opts.fileName, obj.file, obj.file.name);
                each(modules, function(mod){
                    var file = mod.getFileOuter();
                    if(file.obj){
                        fd.append(file.fileName, file.obj.file, file.obj.file.name);
                    }
                });
                if(opts.clear) modules = [];
                xhr.open("POST", opts.url);
                xhr.send(fd);
            }

        },
        getFileIndex: function(){
            if(uploadFile == null) return 0;
            return uploadFile.index;
        },
        uploadNext: function(){
            isHandCancel = true;
            uploadFile = null;
            fireEvent(xhr, "abort");
            custFuncs.multipleUpload();
        },
        stopUpload: function(){
            if(uploadFile != null){
                isHandCancel = true;
                cancelUploadItems[uploadFile.index] = uploadFile.index;
                //uploadFile = null;
                fireEvent(xhr, "abort");
            }else{
                that.fire("warn", {data: opts.data, msg: warnMsg[8], key: 8});
            }
        },
        createNode: function(name, theme){
            var node = document.createElement(name);
            if(theme){
                each(theme, function(v, k){
                    node.style[k] = v;
                });
            }
            return node;
        },
        loadFile: function(){
            var fileDiv = custFuncs.createNode("div", {
                position: "absolute",
                overflow: "hidden",
                width: "auto",
                border: "0 none",
                top: "0",
                left: "0",
                zIndex: 1
            });
            var fileForm = null;
            if(isNode(opts.bindForm)){
                fileForm = opts.bindForm;
            }else{
                fileForm = custFuncs.createNode("form");
            }
            fileForm.method = "POST";
            fileForm.enctype = "multipart/form-data";
            fileForm.action = opts.url;
            var fileCode = custFuncs.createNode("input");
            fileCode.type = "file";
            fileCode.name = opts.fileName;
            if(isNode(opts.bindForm) || !opts.createForm){
                fileDiv.appendChild(fileCode);
            }else{
                fileForm.appendChild(fileCode);
                fileDiv.appendChild(fileForm);
            }
            node.style.position = "relative";
            node.appendChild(fileDiv);
            opts.multiple && fileCode.setAttribute("multiple", "multiple");
            var width =  Math.min(50, node.offsetWidth);
            var height = Math.min(26, node.offsetHeight);

            setStyle(fileDiv, {
                height: height + "px",
                width: width + "px",
                lineHeight: "0"
            });
            fileCode.style.width = width + "px";
            var inputWidth = fileCode.offsetWidth;
            var left = inputWidth - width;
            setStyle(fileCode, {
                position: "relative",
                right: left + "px",
                margin: 0,
                padding: 0,
                cursor: "pointer",
                opacity: 0,
                filter: "alpha(opacity=0)",
                height: height + "px"
            });
            nodeList.fileInput = fileCode;
            nodeList.fileDiv = fileDiv;
            nodeList.fileForm = fileForm;
            pos.nodeWidth = node.offsetWidth;
            pos.nodeHeight = node.offsetHeight;
            pos.fileWidth = width;
            pos.fileHeight = height;
            opts.disabled && className.add(fileDiv, "hide");
        },
        disabled: function(bool){
            opts.disabled = bool;
            if(bool){
                className.add(nodeList.fileDiv, "hide");
            }else{
                className.remove(nodeList.fileDiv, "hide");
            }
        },
        bindFile: function(mod){
            each([].concat(mod), function(item){
                modules.push(item);
            });
        },
        activeFile: function(){
            fileset = clone(cacheMap);
        },
        clearFile: function(){
            nodeList.fileInput.value = "";
            cacheMap = {};
            fileset = {count: 0};
            modules = [];
        },
        getFrameHTML: function(io){
            var text = "";
            try {
                if (io.contentWindow) {
                    text = io.contentWindow.document.body ? io.contentWindow.document.body.innerHTML : null;
                    if (io.contentDocument) {
                        text = io.contentDocument.document.body ? io.contentDocument.document.body.innerHTML : null;
                    }
                }
            }
            catch (e) {
            }
            return text;
        },
        getFileOuter: function(){
            var msg = {node: node, fileName: opts.fileName};
            each(fileset, function(v){
               if(getType(v) == "object"){
                   msg.obj = v;
                   return false;
               }
            });
            return msg;
        },
        setData: function(data){
            opts.data = merge(opts.data || {}, data || {});
        },
        callback: function(r){
            var res = r.responseText;
            var type = opts.dataType;
            //console.log(xhr.getResponseHeader("Content-Type"));
            if(res != null && res.indexOf("</pre>") != -1){
                res = res.replace("<pre>", "").replace("</pre>", "");
            }
            if(type=="xml"){
                res = r.responseXML;
            }else{
                try{
                    res = (new Function("return " + res))();
                }catch(ex){
                    res = r.responseText;
                }
            }
            return res;
        }
    }

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;
        xhr = new XMLHttpRequest();
        fileset.count = 0;
        custFuncs.loadFile();
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();
    }

    //---------------暴露API----------------
    that.init = init;
    that.upload = custFuncs.runUpload;
    that.setData = custFuncs.setData;
    that.disabled = custFuncs.disabled;
    that.uploadNext = custFuncs.uploadNext;
    that.getFileIndex = custFuncs.getFileIndex;
    that.stopUpload = custFuncs.stopUpload;
    that.bindFile = custFuncs.bindFile;
    that.activeFile = custFuncs.activeFile;
    that.clearFile = custFuncs.clearFile;
    that.getFileOuter = custFuncs.getFileOuter;
    that.fileBase64 = custFuncs.fileBase64;

    return that;
};