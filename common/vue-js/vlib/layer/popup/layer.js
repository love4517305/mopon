/**
 * popup浮层
 * 璩小孩
 */

import Vue from 'vue'
import popup from './popup.vue'
import contains from 'vlib/dom/contains'
import { bus } from 'vlib/comp/bus'
import {isObject } from  'vlib/util/dataType'

const _popup_object_ = [];

Vue.prototype.$message = function(fn){
    let stop = false;
    _popup_object_.forEach(p => {
        if(!stop && contains(p.$el, this.$el)){
            stop = true;
            p.pushMessage(fn);
            bus.$once(p.get("destroy"), () => {
                _popup_object_.splice(_popup_object_.indexOf(p), 1);
            });
        }
    });
};

export default function(html, opts, store){
    let bool = isObject(html);
    const vm = new Vue({
        el: document.createElement("DIV"),
        store: bool ? opts : store,
        data () {
            return {
                option: bool ? html : opts
            }
        },
        template: '<popup v-bind="option" ref="popup"></popup>',
        components: { popup }
    });

    const rs = vm.$refs.popup;

    if(!bool){
        rs.createHTML(html);
    }

    _popup_object_.push(rs);

    return rs;
};