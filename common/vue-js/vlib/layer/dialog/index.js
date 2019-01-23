/**********
 * 弹框
 * 璩小孩 20170802
 */
import popup from 'vlib/layer/popup';
import myDialog from './dialog.vue';
import { bus, fire } from 'vlib/comp/bus';
import {isFunction } from 'vlib/util/dataType';
import Vue from 'vue'

Vue.prototype.$popupCenter = function(fn){
    this.$nextTick(() => {
        setTimeout(() => {
            this.$emit("update", {type: "center"});
            fn && fn();
        }, 10);
    });
};

const DialogManager = function (myContent, option = {}) {
    let m_dialog = popup("<my-dialog @close='hideDialog' @click='butClick' :buts='buts' :option='option'><my-content ref='content' @send='sendMessage' @update='update' @close='hideDialog' :option='option'></my-content></my-dialog>", {
        option: {
            showCenter: true,
            autoHide: false,
            animate: {
                name: option.animate || "scale"
            }
        },
        popup: {
            data () {
                return { option , buts: {}};
            },
            components: {
                myDialog,
                myContent
            },
            methods: {
                update (opt = {}) {//add, del, edit
                    if(opt.type === "center"){
                        m_dialog.setAniCenter();
                    }else{
                        m_dialog.popup.buts = opt;
                    }
                },
                sendMessage (opt) {
                    fire(m_dialog.get("message"), opt);
                },
                butClick (opt) {
                    fire(m_dialog.get(opt.key), opt.item);
                },
                hideDialog (opt) {
                    m_dialog.hide(m_dialog.destroy, null, opt);
                }
            }
        }
    });

    const child = m_dialog.popup.$refs.content;
    isFunction(child.moduleInit) && bus.$once(m_dialog.get("popup.init"), child.moduleInit);
    isFunction(child.dialogShow) && bus.$once(m_dialog.get("show"), child.dialogShow);
    isFunction(child.dialogHide) && bus.$once(m_dialog.get("hide"), child.dialogHide);

    return m_dialog;
};

export default DialogManager;