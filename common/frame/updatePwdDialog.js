/**
弹框
 */
module.exports = function(opts) {
    //----------------require--------------
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var className = require("lib/dom/className");
    var trim = require("lib/str/trim");
    var formVerify = require("plugin/util/formVerify");
    var render = require("./updatePwd.ejs");
    var dialogManager = require("plugin/dialog/manager");
    var dialog = require("plugin/dialog/dialog");
    var when = require("lib/util/when");
    var runtime = require("plugin/runtime");
    var ajax = require("lib/io/ajax");
    var md5 = require("lib/util/md5");

    opts = opts || {};
    var config = {
        title: "修改密码",
        close: opts.hasClose,
        boxHTML: render({ isDefaultPwd: opts.isDefaultPwd }),
        buttons: opts.btns
    };
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = dialog(config);
    var node = that.getOuter();
    var m_formVerify = null;
    var MAX_PASSWORD_LEN = 36;
    var MIN_PASSWORD_LEN = 6;

    //-------------事件响应声明---------------
    var evtFuncs = {
        formVerify: function(evt) {
            var rv = evt.data;
            if (!rv.yes) {
                custFuncs.showError(rv.statusText);
                return;
            } else if (rv.result.new_pwd != rv.result.ok_pwd) {
                custFuncs.showError("新密码两次输入不一致");
                return;
            } else if (rv.result.new_pwd.length < MIN_PASSWORD_LEN || rv.result.new_pwd.length > MAX_PASSWORD_LEN) {
                custFuncs.showError("密码请输入6~36位数字、字母、特殊字符");
                return;
            }

            delete rv.result.ok_pwd;

            rv.result.old_pwd = md5(rv.result.old_pwd);
            rv.result.new_pwd = md5(rv.result.new_pwd);

            custFuncs.clearError();
            custFuncs.postSubmit(rv.result)
                .then(function(res) {
                    that.hide();
                    dialogManager.alert("修改密码成功！", {
                        icon: "suc",
                        ok: function() {
                            that.fire('suc');
                            // top.location.href = "/login.html";
                        }
                    });
                });
        },
        buttonClick: function(evt){
            if(evt.data.type == "ok"){
                m_formVerify.run();
            }else if(evt.data.type == "cancel"){
                that.hide("cancel");
            }
        }
    }

    //-------------子模块实例化---------------
    var initMod = function(){
        m_formVerify = formVerify(nodeList.dialogForm);
        m_formVerify.init({data: opts.data, extraData: opts.type});
    }

    //-------------绑定事件------------------
    var bindEvents = function() {
        m_formVerify.bind("verify", evtFuncs.formVerify);
        that.bind("buttonclick", evtFuncs.buttonClick);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        showError: function(msg) {
            nodeList.message.innerHTML = '<span></span>' + msg;
        },
        clearError: function() {
            nodeList.message.innerHTML = "";
        },
        postSubmit: function(data) {
            var defer = when.defer();
            ajax({
                url: "/proxy/cloud/platform/modifyPwd",
                data: data,
                method: "post",
                onSuccess: function(res) {
                    if (res.code == 0) {
                        defer.resolve(res);
                    } else {
                        custFuncs.showError(res.msg);
                        defer.reject(res.msg);
                        // dialogManager.alert(res.msg);
                    }
                },
                onError: function(req) {
                    defer.reject(req);
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        }
    }

    //-------------一切从这开始--------------
    // 找到所有带有node-name的节点
    nodeList = parseModule(node);
    // 子模块实例化
    initMod();
    // 绑定事件
    bindEvents();

    //---------------暴露API----------------

    return that;
};