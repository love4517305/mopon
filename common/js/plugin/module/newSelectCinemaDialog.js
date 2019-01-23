/**
 选择影院 by璩
 */
module.exports = function (opts) {
    //----------------require--------------
    var base = require("lib/comp/base"); // 基础对象
    var parseModule = require("lib/dom/parseModule"); // 页面模块自动解析
    var className = require("lib/dom/className");
    var runtime = require("plugin/runtime");
    var ajax = require("lib/io/ajax");
    var dialogManager = require("plugin/dialog/frameDialogManager");
    var dialog = dialogManager.getDialog("plugin/dialog/dialog");
    var search = require("plugin/module/searchBase");
    var render = require("plugin/tmpl/newSelectCinema.ejs");
    var groupItem = require("plugin/tmpl/groupItem.ejs");
    var when = require("lib/util/when");
    var tree = require("plugin/module/mTree");
    var addEvent = require('lib/evt/add');
    var merge = require("lib/json/merge");
    var each = require("lib/util/each");
    var page = require("plugin/module/page");
    var eventProxy = require("lib/evt/proxy");
    var clone = require("lib/json/clone");
    var sizzle = require("lib/dom/sizzle");
    var winSize = require("lib/util/winSize");

    //-----------声明模块全局变量-------------
    //isHalls 默认为true，带影厅false为不带，snackId是影院ID，选中用
    opts = merge({
        map: {},
        isHalls:opts.isHalls||true,
        cinemaGroup:opts.cinemaGroup||true,
        hallsGroup:opts.hallsGroup||true,
        selectType:opts.selectType||"checkbox",
        connect:false// hallid以 cinemaCode+"_"+hallCode形式返回
    },opts);

    var config = {
        title: "选择影院",
        boxHTML: render({type: opts.type,isHalls:opts.isHalls,cinemaGroup:opts.cinemaGroup,hallsGroup:opts.hallsGroup}),
        buttons: [
            {"id": "ok", "text": "保存", "type": "blue"},
            {"id": "cancel", "text": "关闭"}
        ]
    };
    if (opts.type == "look") {
        config.buttons = [{"id": "cancel", "text": "关闭"}]
    }
    if (opts.type == "lookAndEdit") {
        config.buttons = [{"id": "lookAndEdit", "text": "关闭并编辑"}, {"id": "cancel", "text": "关闭"}]
    }
    //-----------声明模块全局变量-------------
    var nodeList = null; // 存储所有关键节点
    var that = dialog(config);
    var node = that.getOuter();
    var m_search = null;
    var m_tree = null;
    var m_page = null;
    var params = {
        curPage: 1,
        pageSize: opts.isHalls?50:500,
        pageList: [50, 100, 200, 300, 500]
    };
    var selectList = opts.selectData || [];
    var searchArr = [];
    var JsonData = {};
    var changeList = {};
    var searchPage = 0;
    var canUseData = opts.filterData || "";//{"4c851280-afc1-4f08-9eaa-00c4acfa9f4d":true};
    //-------------事件响应声明---------------
    var evtFuncs = {
        prevRes: function () {
            searchPage--;
            if (searchPage < 0) {
                searchPage = searchArr.length - 1
            }
            custFuncs.PageShow(searchPage);

        },
        nextRes: function () {
            searchPage++;
            if (searchPage >= searchArr.length) {
                searchPage = 0;
            }
            custFuncs.PageShow(searchPage);

        },
        filterGroupAndHall: function (e) {
            each(JsonData.cinema, function (v) {
                each(v.children, function (hall) {
                    v.checked = false;
                    hall.checked = false;
                })
            })
            if (e.proxy == "cinemaGroup") {
                evtFuncs.groupsTypeChange(e)
            }else{
                evtFuncs.groupsTypeChange()
            }
            if (e.proxy == "hallsType") {
                evtFuncs.hallsTypeChange(e)
            }else{
                evtFuncs.hallsTypeChange()
            }
        },
        groupsTypeChange: function (e) {
            var getSelectGroups = custFuncs.getSelectGroups()
            var bool = true;
            if (e && e.data.checkAll) {
                var input = sizzle("input", getSelectGroups.box);
                each(input, function (v) {
                    v.checked = getSelectGroups.checkAll;
                });
            }
            var arr = bool ? custFuncs.getSelectGroups().checked : custFuncs.getSelectGroups().unChecked
            each(JsonData.cinema, function (v) {
                if (arr.indexOf(v.cinemaGroup) > -1) {
                    v.checked = bool;
                    each(v.children, function (val) {
                        val.checked = bool;
                    })
                }else{
                    if(v.checked){
                        v.checked = !bool;
                    }
                    each(v.children, function (val) {
                        if(val.checked){
                            val.checked = !bool;
                        }
                    })
                }
            });
            custFuncs.updateView()
        },
        hallsTypeChange: function (e) {
            var getSelectHalls = custFuncs.getSelectHalls()
            var selectTreeData = m_tree.getTreeSelectData()
            var selectData = []
            each(selectTreeData, function(v){
                each(v.child, function(n){
                    each(n.children, function(m){
                        selectData.push(m)
                    })
                })
            })
            var bool = true;
            if (e && e.data.checkAll) {
                var input = sizzle("input", getSelectHalls.box);
                each(input, function (v) {
                    v.checked = getSelectHalls.checkAll;
                });
            }
            var arr = bool ? custFuncs.getSelectHalls().checked : custFuncs.getSelectHalls().unChecked
            if (selectData.length > 0) {
                each(JsonData.cinema, function (v) {
                    each(v.children, function (hall) {
                        for (var i = 0; i < selectData.length; i ++) {
                            var selectItem = selectData[i]
                            if (selectItem.id == hall.id && (arr.indexOf(hall.type) > -1 || arr.length == 0)) {
                                v.checked = bool;
                                hall.checked = bool;
                                break
                            }else{
                                if(v.checked){
                                    v.checked = !bool;
                                }
                                if(hall.checked){
                                    hall.checked = !bool;
                                }
                            }
                        }
                    })
                })
            }else{
                each(JsonData.cinema, function (v) {
                    each(v.children, function (hall) {
                        if (arr.indexOf(hall.type) > -1) {
                            v.checked = bool;
                            hall.checked = bool;
                        }else{
                            if(v.checked){
                                v.checked = !bool;
                            }
                            if(hall.checked){
                                hall.checked = !bool;
                            }
                        }
                    })
                })
            }
            custFuncs.updateView()
        },
        checkChange: function (e) {
            if (!e.data.data) {
                if (e.data.all) {//全选
                    each(JsonData.cinema, function (v) {
                        v.checked = e.data.checked;
                        each(v.children, function (o) {
                            o.checked = e.data.checked;
                        })
                    })
                }
            } else {

                if (e.data.data.code) {
                    if (e.data.data.cid) {//影院
                        each(JsonData.cinema, function (cinema) {
                            if (cinema.id == e.data.data.id) {
                                cinema.checked = e.data.checked;
                                each(cinema.children, function (hall) {
                                    hall.checked = e.data.checked;
                                })
                            }
                        });
                    } else {//影厅
                        each(JsonData.cinema, function (cinema) {
                            each(cinema.children, function (hall) {
                                if (hall.id == e.data.data.id) {
                                    hall.checked = e.data.checked;
                                }
                            })
                        });
                    }
                } else {//城市
                    each(JsonData.cinema, function (cinema) {
                        if (cinema.cid == e.data.data.id) {
                            cinema.checked = e.data.checked;
                            each(cinema.children, function (hall) {
                                hall.checked = e.data.checked;
                            })
                        }
                    });
                }
            }

        },
        page: function (e) {
            params.curPage = e.data.curPage;
            params.pageSize = e.data.pageSize;
            custFuncs.updateView();
        },
        search: function (evt) {
            var cinemaName = evt.data.conditions.cinemaName;
            nodeList.count.innerHTML = "";
            searchArr = [];
            if (cinemaName){
                custFuncs.PageShow(0);
            }else{
                each(JsonData.cinema, function (v) {
                    delete v.highlight;
                });
                params.curPage = 0;
                m_page.setCurPage(1);
                custFuncs.updateView();
            }
        },
        show: function () {
            m_search.init();
            custFuncs.getFindCinema();
        },
        buttonClick: function (evt) {
            if (evt.data.type == "ok") {
                var datalist = custFuncs.getSelectArr();
                var res = custFuncs.getResult();
                // var resultCinema = custFuncs.resultObj(result);
                if(opts.filterFn){
                    opts.filterFn(res.result);
                }
                that.fire("submit", {hallIds: datalist.hallIds, cinemaIds: datalist.cinemaIds, treeResult: res.result,resultCinema:res.cinemas,extraData:opts});
                that.hide("submit");
            } else if (evt.data.type == "cancel") {
                that.hide("cancel");
            } else if (evt.data.type == "lookAndEdit") {
                that.hide("cancel");
                that.fire("lookAndEdit");
            }
        },
    }

    //-------------子模块实例化---------------
    var initMod = function () {
        m_tree = tree(nodeList.treeBox, {
            title: {text: "全选"},
            selectType:opts.selectType||"checkbox",
            filter: {text: "name", key: "id", child: "child"},
            tiled: {child: "children"},
            checkParents: true,
            isFullCheck: true
        });
        m_tree.init();
        m_search = search(nodeList.searchBox);
    }

    //-------------绑定事件------------------
    var bindEvents = function () {
        that.bind("show", evtFuncs.show);
        m_search.bind("search", evtFuncs.search);
        that.bind("buttonclick", evtFuncs.buttonClick);
        m_tree.bind("checkbox", evtFuncs.checkChange);
        m_tree.bind("radio", evtFuncs.checkChange);
        addEvent(nodeList.prev, "click", evtFuncs.prevRes);
        addEvent(nodeList.next, "click", evtFuncs.nextRes);
        var proxy1 = eventProxy(nodeList.cinemaGroup);
        var proxy2 = eventProxy(nodeList.hallsType);
        proxy1.add('cinemaGroup', 'change', evtFuncs.filterGroupAndHall);
        proxy2.add('hallsType', 'change', evtFuncs.filterGroupAndHall);
    }

    //-------------自定义函数----------------
    var custFuncs = {
        getSelectGroups () {
            var obj = {}
            obj.checked = []
            obj.unChecked = []
            obj.checkAll = false
            obj.box = nodeList.cinemaGroup
            var nodes = nodeList.cinemaGroup.children
            each(nodes,function(v,i){
                var item = v.children[0].children[0]
                if(i != nodes.length - 1){
                    if (item.checked) {
                        obj.checked.push(item.getAttribute("data-query").split("=")[1])
                    }else{
                        obj.unChecked.push(item.getAttribute("data-query").split("=")[1])
                    }
                }else{
                    if (item.checked) {
                        obj.checkAll = true
                    }
                }
            })
            return obj
        },
        getSelectHalls () {
            var obj = {}
            obj.checked = []
            obj.unChecked = []
            obj.checkAll = false
            obj.box = nodeList.hallsType
            var nodes = nodeList.hallsType.children
            each(nodes,function(v,i){
                var item = v.children[0].children[0]
                if(i != nodes.length - 1){
                    if (item.checked) {
                        obj.checked.push(item.getAttribute("data-query").split("=")[1])
                    }else{
                        obj.unChecked.push(item.getAttribute("data-query").split("=")[1])
                    }
                }else{
                    if (item.checked) {
                        obj.checkAll = true
                    }
                }
            })
            return obj
        },
        resultObj:function(evt){
            return m_tree.getSelectData(true);
        },
        getResult: function () {
            var arr = [], cinemas = [];
            if(opts.selectType === "radio"){
                arr = m_tree.getSelectData();
                cinemas = m_tree.getSelectData();
            }else {
                if (!opts.isHalls) {
                    each(JsonData.cinema, function (v, k) {
                        if (v.checked) {
                            cinemas.push({
                                cid: v.cid,
                                cinemaGroup: v.cinemaGroup,
                                cname: JsonData.city[v.cid].name,
                                code: v.code,
                                id: v.id,
                                name: v.name
                            });
                            arr.push({
                                cinemaCode: v.code,
                                cinemaId: v.id,
                                disabled: v.disabled,
                                cinemaName: v.name,
                                cityCode: v.cid,
                                cityName: JsonData.city[v.cid].name,
                                groupCode: v.cinemaGroup,
                                groupName: opts.map.cinemaGroup[v.cinemaGroup]
                            })
                        }
                    });
                } else {
                    each(JsonData.cinema, function (v, k) {
                        cinemas.push({
                            cid: v.cid,
                            cinemaGroup: v.cinemaGroup,
                            cname: JsonData.city[v.cid].name,
                            code: v.code,
                            id: v.id,
                            name: v.name
                        });
                        each(v.children, function (val) {
                            if (val.checked) {
                                arr.push({
                                    cinemaId: v.id,
                                    cinemaCode: v.code,
                                    hallId: opts.connect ? v.code + "_" + val.code : val.id,
                                    hallCode: val.code,
                                    hallName: val.name,
                                    cinemaName: v.name,
                                    cityCode: v.cid,
                                    cityName: JsonData.city[v.cid].name,
                                })
                            }
                        });
                    });
                }
            }
            return {result: arr, cinemas: cinemas};
        },
        getJsonKey: function(){
            var key = 'cache';
            if(opts.filtType >= 2 && opts.filtType <= 5){
                key = 'cache' + opts.filtType;
             }
            return key;
        },
        getJsonData: function () {
            JsonData = clone(top.window[custFuncs.getJsonKey()]);
            if(opts.key == "code"){
                each(JsonData.cinema,function(v){
                    v.id = v.code;
                    each(v.children,function(item){
                        if(opts.connect){
                            item.id = v.code + "_" + item.code;
                        }else{
                            item.id = item.code;
                        }
                    })
                })
            }
            if (opts.type == "look" || opts.type == "lookAndEdit") {
                canUseData = opts.selectData||""
            }
            if (!opts.isHalls) {
                each(JsonData.cinema, function (v) {
                    delete v.children
                })
            }
            var newObj = [];
            if (canUseData) {
                each(JsonData.cinema, function (v, k) {
                    var arr = [];
                    var ispullCinema = true;
                    if(canUseData.indexOf(v.id)>-1&&opts.isHalls){
                        newObj.push(v);
                    }
                    if(v.children&&v.children.length) {
                        each(v.children, function (hall) {
                            if (canUseData.indexOf(hall.id) > -1) {
                                arr.push(hall);
                                v.children = arr;
                                if (ispullCinema) {
                                    newObj.push(v);
                                    ispullCinema = false;
                                }

                            }

                        });
                    }else{
                        if (canUseData.indexOf(v.id) > -1) {
                            arr.push(v);
                            if (ispullCinema) {
                                newObj.push(v);
                                ispullCinema = false;
                            }

                        }
                    }
                });
                JsonData.cinema = newObj;
            }
            if(opts.disabledSelect){
                each(JsonData.cinema, function (v, k) {
                    var arr = [];
                    if(v.children&&v.children.length) {
                        each(v.children, function (hall) {
                            if (opts.disabledSelect.indexOf(hall.id) > -1) {
                                hall.disabled = true;
                            }

                        });
                    }else{
                        if (opts.disabledSelect.indexOf(v.id) > -1) {
                            v.disabled = true;

                        }
                    }
                });
            }
        },
        printType: function () {
            each(opts.map, function (v, k) {
                nodeList[k].innerHTML = groupItem({data: opts.map[k], type: k});
            })
        },
        getCinemaGroup: function (url) {
            var defer = when.defer();
            ajax({
                wait: true,
                method: "post",
                url: "/proxy/" + url,
                onSuccess: function (res) {
                    if (res.code == 0) {
                        opts.map["cinemaGroup"] = res.data.group;
                        defer.resolve(res);
                    } else {
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function (req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        getHallsType: function (url) {
            var defer = when.defer();
            ajax({
                wait: true,
                method: "post",
                url: "/proxy/" + url,
                onSuccess: function (res) {
                    if (res.code == 0) {
                        var obj = {};
                        each(res.data, function (v) {
                            obj[v.id] = v.name;
                        });
                        opts.map["hallsType"] = obj;
                        defer.resolve(res);
                    } else {
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function (req) {
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        dealAllData: function () {
            each(JsonData.cinema, function (v) {
                v.checked = selectList.indexOf(v.id) > -1;
                v.children && each(v.children, function (hall) {
                    hall.checked = selectList.indexOf(hall.id) > -1;
                });
            })
        },
        PageShow: function (page) {
            var cinemaName = nodeList.cinemaName.value;
            if (!cinemaName) return;
            var initFirst = false;
            if(searchArr.length === 0){
                initFirst = true;
                each(JsonData.cinema, function (v, n) {
                    delete v.highlight;
                    if (v.name.indexOf(cinemaName) > -1) {
                        v.highlight = "highlight";
                        searchArr.push({page: Math.ceil((n + 1) / params.pageSize), id: v.id});
                    }
                });
            }
            var len = searchArr.length;
            var lastPage = len > page ? searchArr[page].page : 0;
            nodeList.count.innerHTML = "共搜索到影院<em>" + len + "</em>家" + (len > 0 ? "，当前为第<em>" + (page + 1) + "</em>条结果" : "");
            if(initFirst || params.curPage !== lastPage){
                params.curPage = lastPage;
                m_page.setCurPage(len > page ? searchArr[page].page : 1);
                custFuncs.updateView();
            }
            var id = len > page ? searchArr[page].id : null;
            if(id) m_tree.location(id);
        },
        getSelectArr: function () {
            var arr = [], cinemas = [];
            var eachData = function (data, cinemaId) {
                var isPush = true;
                each(data, function (v) {
                    if (v.children) {
                        eachData(v.children, v.id);
                    } else {
                        if (v.checked) {
                            arr.push(v.id);
                            if(isPush){
                                isPush = false;
                                cinemas.push(cinemaId);
                            }
                        }
                    }
                })
            };
            eachData(JsonData.cinema);
            return {hallIds: arr, cinemaIds: cinemas};
        },
        filterData: function () {
            var cinema = JsonData.cinema;
            var cityMap = JsonData.city;
            var tree = {};
            var dataTree = [];
            var cinemaCheck = true;
            for (var i = (params.curPage - 1) * params.pageSize; i < Math.min(cinema.length, params.pageSize * params.curPage); i++) {
                var children = cinema[i];
                if (selectList.indexOf(children.id) > -1 || opts.disabledSelect && opts.disabledSelect.indexOf(children.id) > -1) {
                    children.checked = true;
                }
                each(children.children, function (obj) {
                    if (!obj.checked) {
                        cinemaCheck = false
                    }
                });
                if (opts.isHalls) {
                    if (tree[children.cid]) {
                        children.checked = cinemaCheck;
                        tree[cinema[i].cid].push(children);
                    } else {
                        children.checked = cinemaCheck;
                        tree[cinema[i].cid] = [children];
                    }
                } else {
                    if (tree[children.cid]) {
                        tree[cinema[i].cid].push(children);
                    } else {
                        tree[cinema[i].cid] = [children];
                    }
                }


            }
            each(tree, function (v, k) {
                dataTree.push({name: cityMap[k].name, id: k, child: tree[k],checkbox:opts.selectType == "radio"?false:true});
            });
            return dataTree;
        },
        getTreeData: function (url) {
            var defer = when.defer();
            ajax({
                wait: true,
                url: "/proxy/base/site/baseinfo/v1/" + url,
                data: {},
                method: "post",
                onSuccess: function (res) {
                    if (res.code == 0) {
                        defer.resolve(res);
                        JsonData["cinema"] = res.data
                    } else {
                        defer.reject(res.msg);
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function (req) {
                    defer.reject(req);
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        getTreeCity: function (url) {
            var defer = when.defer();
            ajax({
                wait: true,
                url: "/proxy/base/site/baseinfo/v1/" + url,
                data: {},
                method: "post",
                onSuccess: function (res) {
                    if (res.code == 0) {
                        defer.resolve(res);
                        JsonData["city"] = res.data
                    } else {
                        defer.reject(res.msg);
                        dialogManager.alert(res.msg);
                    }
                },
                onError: function (req) {
                    defer.reject(req);
                    console.error(runtime.getHttpErrorMessage(req));
                }
            });
            return defer.promise;
        },
        updateView: function () {
            var treeData = custFuncs.filterData();
            m_tree.addTreeItems(treeData);
            opts.disabledSelect && m_tree.setDisabled(true, opts.disabledSelect);
            if (opts.type == "look" || opts.type == "lookAndEdit") {
                m_tree.setDisabled(true);
            }
            nodeList.treeBox.scrollTop = 0;
        },
        initView: function () {
            custFuncs.initPageData()
                .then(function (res) {
                    custFuncs.printType();
                    custFuncs.dealAllData();
                    custFuncs.updateView();
                    m_page = page(nodeList.curPage, params);
                    m_page.init();
                    m_page.updatePage(JsonData.cinema.length);
                    m_page.bind("page", evtFuncs.page);
                    var height = winSize().height * 0.8;
                    nodeList.treeBox.style.height = height - nodeList.filter.offsetHeight - 130 + "px";
                    that.setMiddle();
                })

            //console.log(arr)

            /*custFuncs.getTreeData(true)
                .then(function(res){
                    m_tree.insertTreeItems(res.data);
                    if(opts.selectData.length > 0){
                        m_tree.selectTreeItems(opts.selectData, true, opts.disabled);
                    }
                    if (opts.isReadOnly) {
                        m_tree.setDisabled(true);
                    }
                });*/
        },
        initPageData: function () {
            var defer = when.defer();
            when.all([
                custFuncs.getCinemaGroup(opts.groupAjax||"base/site/ticket/v1/getCinemaGroups"),
                custFuncs.getHallsType(opts.hallsAjax||"base/site/ticket/v1/listHallTypes")
            ])
                .then(function (res) {
                    defer.resolve(res);
                }).otherwise(function (msg) {
                console.log(msg);
                defer.reject("页面初始化所需数据无法全部获取, 请刷新界面");
            });
            return defer.promise;
        },
        getFindCinema: function() {
            dialogManager.wait();
            var key = custFuncs.getJsonKey();
            var timer = setInterval(function(){
                var data = top.window[key];
                if(data && data.cinema && data.city){
                    clearInterval(timer);
                    custFuncs.getJsonData();
                    custFuncs.initView();
                    dialogManager.closeWait();
                }
            }, 100);
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