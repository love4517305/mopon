/**
 * Created by liuxinxin on 2016/7/18.
 * @desc 树形结构组件
 */
//----------------require--------------

var base = require("lib/comp/base"); // 基础对象
var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
var className = require('lib/dom/className');
var nodeOperate = require('lib/dom/node');
var sizzle = require('lib/dom/sizzle');
var addEvent = require("lib/evt/add");
var closest = require("lib/dom/closest");
var merge = require("lib/json/merge");

module.exports = function(node, opts) {
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = base();
    var data = null;
    var curTreeItem = null;
    var selectedItems = [];
    var dataSet = null;
    var foldItemCallBack = null;
    var selectItemCallBack = null;

    opts = merge({
        iconFold: 'icon-fold',
        iconUnFold: 'icon-unfold',
        iconFolder: 'icon-folder',
        iconUnFolder: 'icon-unfolder',
        codeColumnName: 'code',
        textColumnName: 'text',
        childColumnName: 'children'
    }, opts || {})

    //-------------事件响应声明---------------
    var evtFuncs = {
        chooseItem: function(e) {
            var target = e.target,
                tmpTar,
                type = target.getAttribute('operate-type'),
                wrap = closest(target, '[node-name="itemWrap"]'),
                code;
            if(!wrap){
                return;
            }
            if(!type){
                tmpTar = closest(target, '[operate-type]');
                tmpTar && (type = tmpTar.getAttribute('operate-type'));
            }
            if(type === 'fold'){
                custFuncs.toggleFold(target);
            }else if(type === 'select'){
                code = closest(target, '[node-name="itemWrap"]').getAttribute('data-code');
                custFuncs.chooseItem(code);
            }
        }
    };

    //-------------子模块实例化---------------
    var initMod = function() {};

    //-------------绑定事件------------------
    var bindEvents = function() {
        addEvent(node, 'click', evtFuncs.chooseItem);
    };

    //-------------自定义函数----------------
    var custFuncs = {
        toggleFold: function(target, flag, operate) {
            var wrap = closest(target, '[node-name="itemWrap"]'),
                first = nodeOperate.next(wrap),
                isSelect = false;
            if(flag === 'manual' && !className.has(first, 'hide')
                && !className.has(first, 'show')){
                return;
            }
            if(flag === 'manual'){
                //说明是手动操作树中的某一项
                if(operate === 'select'){
                    isSelect = true;
                    custFuncs.foldTree(first,target);
                }else{
                    isSelect = false;
                    custFuncs.unfoldTree(first,target);
                }

            }else{
                if(className.has(first, 'hide')){
                    custFuncs.unfoldTree(first,target);
                }else{
                    custFuncs.foldTree(first,target);
                }
            }

            if(that.foldItemCallBack && typeof that.foldItemCallBack == 'function'){
                that.foldItemCallBack(target, isSelect);
            }
        },
        foldTree: function(first, target) {
            className.remove(first, 'show');
            className.add(first, 'hide');
            className.remove(target, opts.iconUnFold);
            className.add(target, opts.iconFold);
            className.remove(nodeOperate.next(target), opts.iconUnFolder);
            className.add(nodeOperate.next(target), opts.iconFolder);
        },
        unfoldTree: function(first, target) {
            className.remove(first, 'hide');
            className.add(first, 'show');
            className.remove(target, opts.iconFold);
            className.add(target, opts.iconUnFold);
            className.remove(nodeOperate.next(target), opts.iconFolder);
            className.add(nodeOperate.next(target), opts.iconUnFolder);
        },
        chooseItem: function(itemCode, operate) {
            var items = selectedItems.join(),
                index = items.indexOf(itemCode),
                isSelected = false;
            if(itemCode != 0 && !itemCode){
                return;
            }
            if(index !== -1){
                isSelected = false;
                curTreeItem = null;
                if(index === 0){
                    items = items.split(',');
                    items.shift();
                    selectedItems = items;
                }else{
                    selectedItems = items.substr(0, index - 1).split();
                }
            }else{
                isSelected = true;
                curTreeItem = itemCode;
                selectedItems.push(itemCode);
            }
            if(operate){
                if(operate === 'select'){
                    isSelected = true;
                }else if(operate === 'unselect'){
                    isSelected = false;
                }
            }
            if(that.selectItemCallBack && typeof that.selectItemCallBack === 'function'){
                that.selectItemCallBack(itemCode,
                    sizzle('[data-code="' + itemCode + '"] [operate-type="select"]')[0],
                isSelected);
            }
        },
        getItemByCodeOrText: function(code, set) {
            var rs = {},
                f;

            f = function g(code, set, origin) {
                var sets = set || dataSet,
                    i = 0,
                    o = origin || sets,
                    l = sets.length >>> 0;
                for(i;i < l;i += 1){
                    if(sets[i][opts.codeColumnName] === code.trim() ||
                        sets[i][opts.textColumnName].trim() === code.trim()){
                        rs.item = sets[i];
                        rs.parent = o;
                        break;
                    }else if(sets[i][opts.childColumnName]){
                        g(code, sets[i][opts.childColumnName], sets[i]);
                    }
                }
            };
            f(code, set);
            return rs;
        },
        getSelectedTrees: function() {
            return selectedItems;
        },
        getCurSelectedTree: function() {
            return curTreeItem;
        },
        selectItem: function(itemCode) {
            custFuncs.operateItem(itemCode, 'select');
        },
        operateItem: function(itemCode, operate) {
            var pCode = custFuncs.getItemByCodeOrText(itemCode);
            if(pCode.parent){
                pCode = pCode.parent[opts.codeColumnName];
                custFuncs.toggleFold(sizzle('[data-code="' + pCode + '"] [operate-type="fold"]')[0],
                    'manual', operate);
                custFuncs.chooseItem(itemCode, operate);
            }
        },
        unselectItem: function(itemCode) {
            custFuncs.operateItem(itemCode, 'unselect');
        },
        syncData: function(datas) {
            dataSet = datas;
            curTreeItem = null;
            selectedItems = [];
        },
        openAll: function() {
            var i = 0,
                treeNodes = parseModule(node).itemWrap,
                l = treeNodes.length >>> 0,
                foldTar;
            for(i;i < l;i += 1){
                if(nodeOperate.next(treeNodes[i])){
                    foldTar = sizzle('[operate-type="fold"]', treeNodes[i])[0];
                    custFuncs.toggleFold(foldTar, 'manual');
                }
            }
        },
        hideAll: function() {
            var i = 0,
                treeNodes = parseModule(node).itemWrap,
                l = treeNodes.length >>> 0,
                foldTar;
            for(i;i < l;i += 1){
                if(nodeOperate.next(treeNodes[i])){
                    foldTar = sizzle('[operate-type="fold"]', treeNodes[i])[0];
                    custFuncs.toggleFold(foldTar);
                }
            }
        }
    };

    //-------------一切从这开始--------------
    var init = function(_data) {
        data = _data;

        // 根据数据初始化模块

        // 找到所有带有node-name的节点
        nodeList = parseModule(node);
        // 子模块实例化
        initMod();
        // 绑定事件
        bindEvents();

    };

    //---------------暴露API----------------
    that.init = init;
    that.syncData = custFuncs.syncData;
    that.getSelectedTrees = custFuncs.getSelectedTrees;
    that.getCurSelectedTree = custFuncs.getCurSelectedTree;
    that.getItemByCodeOrText = custFuncs.getItemByCodeOrText;
    that.selectItem = custFuncs.selectItem;
    that.unselectItem = custFuncs.unselectItem;
    that.openAll = custFuncs.openAll;
    that.hideAll = custFuncs.hideAll;
    that.selectItemCallBack = null;
    that.foldItemCallBack = null;

    return that;
};