 /*
  *通用模块
   */

 import vDialog from "vlib/layer/dialog";
 import vPopup from 'vlib/layer/popup';
 import { isFunction, isObject, isString } from "vlib/util/dataType";
 import content from "./content.vue";
 import toast from './toast.vue';
 import wait from './wait.vue';
 import popupAlert from './alert.vue'
 import { bind } from 'vlib/comp/bus';

export default {
     init (theme) {
         const common = function(msg, config = {}, type){
             return new Promise((resolve, reject) => {
                 let opts = Object.assign({
                     title: "提示",
                     okText: "确定",
                     cancelText: "取消",
                     icon: "suc",
                     close: true,
                     ok: function(){},
                     cancel: function(){}
                 }, config);
                 const m_dialog = vDialog(content, {
                     msg: msg,
                     icon: opts.icon,
                     close: opts.close,
                     buts: [
                         {text: opts.okText, type: "blue", id: "ok"}
                     ].concat(type === "confirm" ? [{text: opts.cancelText, id: "cancel"}] : [])
                 });
                 m_dialog.show();

                 bind(m_dialog.get("ok"), function(result){
                     m_dialog.hide(m_dialog.destroy, "ok");
                     opts.ok(result);
                     resolve(result);
                 });

                 bind(m_dialog.get("hide"), function(result){
                     (result.state !== "ok") && reject(result);
                 });

                 if(type === "confirm"){
                     bind(m_dialog.get("cancel"), function(result){
                         m_dialog.hide(m_dialog.destroy, "cancel");
                         opts.cancel(result);
                         reject(result);
                     });
                 }
             });
         };
         let _closeWait = null;
         window.$vueDialog = {
             toast (msg, config) {
                 this.closeWait();
                 if(theme === "cloud-ng"){
                     return this.success(msg, config, "err");
                 }else{
                     return new Promise((resolve) => {
                         let opts = Object.assign({
                             overlay: true,
                             barShow: true,
                             barColor: "#fff",
                             showTime: 1.33,
                             top: null,
                             left: null,
                             callback: function () {}
                         }, isObject(config) ? config : {});
                         let m_dialog = vPopup("<toast :msg='msg'></toast>", {
                             option: {
                                 showCenter: true,
                                 autoHide: false,
                                 overlay: {
                                     show: opts.overlay,
                                     opacity: 0
                                 },
                                 progressBar: {
                                     show: opts.barShow,
                                     showTime: opts.showTime,
                                     color: opts.barColor
                                 }
                             },
                             popup: {
                                 data () {
                                     return {
                                         msg: msg || "系统忙，请稍后再试！"
                                     };
                                 },
                                 components: {
                                     toast
                                 }
                             }
                         });
                         m_dialog.show(opts.left, opts.top);
                         bind(m_dialog.get("hide"), function(result){
                             resolve(result);
                             isFunction(config) && (opts.callback = config);
                             opts.callback(result);
                             m_dialog.destroy();
                             opts = null;
                             m_dialog = null;
                         });
                     });
                 }
             },
             wait (fn) {
                 if(_closeWait !== null) return;
                 return new Promise((resolve) => {
                     let m_dialog = vPopup("<wait></wait>", {
                         option: {
                             showCenter: true,
                             autoHide: false,
                             animate: {
                                 name: "slide"
                             },
                             overlay: {
                                 opacity: 0.2
                             }
                         },
                         popup: {
                             components: {
                                 wait
                             }
                         }
                     });
                     m_dialog.show();
                     bind(m_dialog.get("hide"), function(result){
                         resolve(result);
                         isFunction(fn) && fn(result);
                         m_dialog = null;
                     });
                     _closeWait = m_dialog;
                 });
             },
             closeWait() {
                 if(_closeWait !== null){
                     _closeWait.hide(_closeWait.destroy);
                     _closeWait = null;
                 }
             },
             alert (msg, config) {
                 this.closeWait();
                 if(theme === "cloud-ng"){
                     return this.success(msg, config);
                 }else{
                     let option = {};
                     if(isObject(config)){
                         option = config;
                     }else if(isFunction(config)){
                         option.ok = config;
                     }
                     return common(msg, option, "alert");
                 }
             },
             confirm (msg, fn1, fn2, config) {
                 this.closeWait();
                 let option = config ||{};
                 if(isObject(fn1)){
                     option = fn1;
                 }else if(isFunction(fn1)){
                     option.ok = fn1;
                     if(isFunction(fn2)){
                         option.cancel = fn2;
                     }
                 }
                 return common(msg, option, "confirm");
             },
             success (msg, config, type){
                 this.closeWait();
                 if(theme === "cloud-ng"){
                     return new Promise((resolve) => {
                         let opts = Object.assign({
                             overlay: true,
                             showTime: 2,
                             top: null,
                             left: null,
                             type: type || "suc",
                             callback: function () {}
                         }, isObject(config) ? config : {});
                         let m_dialog = vPopup("<popup-alert :msg='msg' :type='type' @close='close'></popup-alert>", {
                             option: {
                                 showCenter: true,
                                 autoHide: false,
                                 overlay: {
                                     show: opts.overlay,
                                     opacity: 0.4
                                 },
                                 progressBar: {
                                     show: false,
                                     showTime: opts.showTime
                                 }
                             },
                             popup: {
                                 data () {
                                     return {
                                         msg: msg || "操作成功！",
                                         type: opts.type
                                     };
                                 },
                                 components: {
                                     popupAlert
                                 },
                                 methods: {
                                     close (){
                                         m_dialog.hide();
                                     }
                                 }
                             }
                         });

                         m_dialog.show(opts.left, opts.top, null, null, () => {
                             m_dialog.setTop(20191111);
                             m_dialog.getOverlay().setStyle({zIndex: 20191110});
                         });
                         bind(m_dialog.get("hide"), function(result){
                             resolve(result);
                             isFunction(config) && (opts.callback = config);
                             opts.callback(result);
                             m_dialog.destroy();
                             opts = null;
                             m_dialog = null;
                         });
                     });
                 }else{
                     let option = {};
                     if(isObject(config)){
                         option = config;
                     }else if(isFunction(config)){
                         option.ok = config;
                     }
                     option.icon = "suc";
                     return common(msg, option, "alert");
                 }
             },
             error (msg, config){
                 if(theme === "cloud-ng"){
                     return this.success(msg, config, "err");
                 }else{
                     let option = {};
                     if(isObject(config)){
                         option = config;
                     }else if(isFunction(config)){
                         option.ok = config;
                     }
                     option.icon = "err";
                     return common(msg, option, "alert");
                 }
             },
             dialog (template, opts) {
                 this.closeWait();
                 if (top.dialogManager && isString(template)) {
                     const obj = top.dialogManager.getDialog(template) || {};
                     return vDialog(obj.default || obj, opts);
                 }
                 return vDialog(template, opts);
             },
             popup (html, opts){
                 if(isObject(opts.popup) && isObject(opts.popup.components)){
                     let obj = opts.popup.components;
                     let nObj = {};
                     for(let k in obj){
                         let template = obj[k];
                         if (top.dialogManager && isString(template)) {
                             const rs = top.dialogManager.getDialog(template) || {};
                             nObj[k] = rs.default || rs;
                         }
                     }
                     opts.popup.components = nObj;
                 }
                 return vPopup(html, opts);
             }
         };
     }
 }
