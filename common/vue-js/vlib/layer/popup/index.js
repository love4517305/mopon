/**
 * popup浮层
 * 璩小孩
 */

import layer from './layer'

export default function(html, opts = {option: {}, popup: {}}, store){
    let vm = layer(opts.option, store);
    vm.popup = vm.vue(html, opts.popup);
    return vm;
};