<template>
    <section class="m-draw-canvas" :style="{height: height + 'px', width: width + 'px'}">
        <div class="draw-but-group" v-if="!view && !warning && !loading">
            <span class="btn hide" @click="finish">完成</span>
            <span class="btn" :class="{checked: selected == 0}" @click="changeType('square', 0)"><i class="square"></i><span>矩形</span></span>
            <span class="btn" :class="{checked: selected == 1}" @click="changeType('circle', 1)"><i class="circle"></i><span>圆形</span></span>
            <span class="btn" :class="{checked: selected == 2}" @click="changeType('polygon', 2)"><i class="polygon"></i><span>多边形</span></span>
            <span class="btn" @click="cancelStation"><i class="pause"></i><span>暂停布点</span></span>
            <span class="btn gray" @click="clear"><i class="clear"></i><span>全部清空</span></span>
            <!--<button class="btn" @click="changeType('oval')">椭圆形</button>-->
        </div>
        <div class="draw-canvas-fixed" ref="drawCanvasGroup" :style="{width: bWidth + 'px', height: bHeight + 'px'}">
            <div :class="{view: view || warning || loading, move: isMove}" class="draw-canvas-group location" @mousemove="drawMouseMove" :style="style" @mousedown="mouseDown" @contextmenu.prevent="">
                <lazy-image class="canvas-image" :style="{width: cWidth + 'px', height: cHeight + 'px'}" :src="src" @suc="loadSuc" @err="loadErr" :auto-destroy="false"></lazy-image>
                <canvas class="draw-canvas" ref="draw-canvas-bg" :width="cWidth" :height="cHeight"></canvas>
                <div class="draw-canvas" v-show="isScroll" :style="{width: cWidth + 'px', height: cHeight + 'px', backgroundColor: colors.bgColor, opacity: colors.bgOpacity}"></div>
                <canvas class="draw-canvas" ref="draw-canvas" :width="cWidth" :height="cHeight"></canvas>
                <canvas class="draw-canvas" ref="draw-canvas-temp-bg" :width="cWidth" :height="cHeight"></canvas>
                <canvas class="draw-canvas" ref="draw-canvas-temp" :width="cWidth" :height="cHeight"></canvas>
                <img class="canvas-image-map" usemap="#map" :style="{width: cWidth + 'px', height: cHeight + 'px'}" :src="mapSrc"/>
                <map name="map" ref="map" @click="triggerMap" @mouseover="mouseOver" @mouseout="mouseOut" @mousemove.stop="tipsHover" @contextmenu="contextMenu"></map>
                <div class="m-loading" v-if="loading"><div class="loading"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
                <div class="m-warn" v-if="warning"><span>{{warnText}}</span></div>
            </div>
        </div>
    </section>
</template>
<script>
    import dialogManager from 'vs/plugin/dialog'
    import {getUniqueId } from 'vlib/comp/bus'
    import {circle, oval} from './drawCanvas'
    import {isBoolean, isString, isObject, isArray, isNode, isFunction, isUndefined } from 'vlib/util/dataType'
    import getOffset from 'vlib/dom/getOffset'
    import popup from 'vlib/layer/popup'
    import viewMenu from './Menu.vue'
    import viewTips from './Hover.vue'
    import lazyImage from 'vs/plugin/lazyImage/lazyImage.vue'
    import formatNumber from 'vlib/util/formatNumber'
    import transform from 'vlib/ani/transform'
    import delay from 'vlib/util/delay'
    import imageLoader from 'lib/io/imageLoader'
    export default {
        props: {
            option: {
                type: Object,
                default () {
                    return {
                        //tipMap: {},
                        //showArea: true,//是否显示区域
                        //showDevice: true//是否显示设备
                    }
                }
            },
            src: {
                type: String,
                default: ""
            },
            syncData: Array
        },
        data () {
            let w = this.option.width || 1200;
            let h = this.option.height || 800;
            return {
                selected: 2,
                warnText: "图片加载不成功！",
                view: this.option.view === true,//视图模式
                width: w + 4,
                height: h + 4,
                bWidth: w,
                bHeight: h,
                cWidth: w,
                cHeight: h,
                imgWidth: 0,
                imgHeight: 0,
                mapSrc: '',
                warning: false,
                loading: true,
                type: "polygon",
                isScroll: false,
                isScaleMin: false,
                isMove: false,
                isSendCoord: true,
                drawStatus: false,
                isMapArea: false,
                record: {},
                records: [],
                icons: {},
                animate: isBoolean(this.option.animate) ? this.option.animate : false,
                showColorIcon: isObject(this.option.colorIcons) && !isObject(this.option.icons),
                colorIcons: {
                    red: {
                        shadowColor: "#fff",
                        start: "#fb6839",
                        end: "#ff2100"
                    },
                    green: {
                        shadowColor: "#fff",
                        start: "#25f988",
                        end: "#0fd053"
                    },
                    black: {
                        shadowColor: "#fff",
                        start: "#444",
                        end: "#000"
                    },
                    white: {
                        shadowColor: "#fff",
                        start: "#fff",
                        end: "#ddd"
                    }
                },
                animateMap: {},
                isRelate: isObject(this.option.items) || isArray(this.option.items),//关联组{}||[]
                drawing: Object.assign([], this.option.data || []),
                hoverID: null,
                stationID: null,
                tipMap: {
                    station: true,//布点提示
                    area: true//场区提示
                },
                showDevice: isBoolean(this.option.showDevice) ? this.option.showDevice : true,
                showArea: isBoolean(this.option.showArea) ? this.option.showArea : true,
                deviceMap: {
                    next: true,
                    index: 0,
                    type: null,
                    list: []
                },
                style: {width: w + 'px', height: h + 'px'},
                dragData: {
                    x: 0,
                    posX: 0,
                    y: 0,
                    poxY: 0
                },
                tid1: null,
                tid2: null,
                tid3: null,
                colors: {
                    bgColor: "#000",
                    bgOpacity: 0.02,
                    textColor: "#420047",
                    strokeColor: "#B64BFE",
                    strokeHoverColor: "#32CCF6",
                    stationHoverColor: "#F00",
                    stationFillHoverColor: "#F00",
                    fillColor: "#B64BFE",
                    fillHoverColor: "#32CCF6",
                    fillOpacity: 0.2
                },
                areaNode: null
            }
        },
        mounted () {
            let self = this;
            self.colors = Object.assign({}, self.colors, self.option.colors || {});
            self.tipMap = Object.assign({}, self.tipMap, self.option.tipMap || {});

            self.menu = popup('<view-menu @select="dropSelect"/>', {
                option: {
                    autoHide: true,
                    overlay: {
                        show: false
                    },
                    animate: {
                        name: "fade"
                    }
                },
                popup: {
                    components: {
                        viewMenu
                    },
                    methods: {
                        dropSelect (type) {
                            self.menu.hide();
                            self.tips.hide();
                            if(type === "del" && self.areaNode !== null){
                                self.getItem(self.areaNode, (item, index) =>{
                                    if(item.id === self.stationID){
                                        self.cancelStation();
                                    }
                                    self.drawing.splice(index, 1);
                                    self.areaNode = null;
                                    self.drawGraph(true);
                                    self.$emit("change", {
                                        type: "delArea",
                                        text: "删除选区",
                                        result: item
                                    });
                                });
                            }else if(type === "edit" && self.areaNode !== null){
                                let rs = self.getItem(self.areaNode);
                                if(rs === null) return;
                                let dialog = dialogManager.dialog("plugin/drawBoard/editContent", {
                                    title: "关联场区",
                                    coord: rs.coord,
                                    desc: rs.desc,
                                    text: rs.text,
                                    items: self.isRelate ? self.option.items : null,
                                    buts: [{text: "确定", id: "ok", type: "blue"}, {text: "取消", id: "cancel"}]
                                });
                                dialog.show();
                                dialog.bind("ok", () => {
                                    dialog.postMessage({type: "submit"});
                                });
                                dialog.bind("cancel", () => {
                                    dialog.hide(dialog.destroy);
                                });
                                dialog.bind("message", opt => {
                                    dialog.hide(dialog.destroy);
                                    rs.text = opt.text;
                                    rs.coord = opt.coord;
                                    rs.desc = opt.desc;
                                    rs.name = opt.name;
                                    self.drawText(self.ctx, rs);
                                });
                            }
                        }
                    }
                }
            });
            self.menu.bind("hide", () => {
                self.areaNode = null;
            });

            self.tips = popup('<view-tips/>', {
                option: {
                    overlay: {
                        show: false
                    },
                    animate: {
                        name: "fade"
                    }
                },
                popup: {
                    components: {
                        viewTips
                    }
                }
            });
            self.initCanvas();
            self.initIcon();
            self.bindScroll();
        },
        watch: {
            src () {
                this.warning = false;
                this.loading = true;
            },
            syncData (v) {
                if(isArray(v)){
                    this.drawing = v;
                    this.scaleImage();
                }
            }
        },
        components: {
            lazyImage
        },
        methods: {
            bindScroll () {
                this.$refs.drawCanvasGroup.addEventListener("mousewheel", this.mouseScroll);
                this.$refs.drawCanvasGroup.addEventListener("DOMMouseScroll", this.mouseScroll);
            },
            mouseScroll (ev) {
                ev.preventDefault();
                if(this.drawStatus) return;
                if(ev.wheelDelta){
                    if(parseInt(ev.wheelDelta) < 0){
                        this.scale -= 0.02;
                    }
                    if(parseInt(ev.wheelDelta) > 0){
                        this.scale += 0.02;
                    }
                }else if(ev.detail){//Firefox
                    if(parseInt(ev.detail) < 0){
                        this.scale += 0.02;
                    }
                    if(parseInt(ev.detail) > 0){
                        this.scale -= 0.02;
                    }
                }
                if(this.scale - 0.02 >= 1){
                    this.scale = 1;
                    return;
                }
                this.scale = Math.max(this.ratio, Math.min(1 ,this.scale));
                if(this.isScaleMin === true && this.scale === this.ratio){
                    this.scaleImage(true, true);
                    return;
                }
                this.isScaleMin = this.scale === this.ratio;
                this.scaleImage(true);
            },
            initIcon () {
                let icons = this.option.icons;
                if(isObject(icons)){
                    let count = 0, realCount = 0;
                    for(let key in icons){
                        count++;
                        imageLoader(icons[key], img => {
                            if(img !== null){
                                this.icons[key] = img;
                            }
                            realCount++;
                            if(realCount === count && !this.loading && !this.warning){
                                this.drawGraph(true);
                            }
                        });
                    }
                }
            },
            loadSuc (opt) {
                this.imgWidth = opt.width;
                this.imgHeight = opt.height;
                let w = this.option.width || 1200;
                let h = this.option.height || 800;
                let scale = opt.width / opt.height;
                let sc = parseInt(w) / parseInt(h);
                if(scale >= sc){
                    this.cWidth = w;
                    this.cHeight = w / scale;
                }else{
                    this.cWidth = h * scale;
                    this.cHeight = h;
                }

                this.height = this.cHeight + (this.view ? 10 : 80);
                this.ratio = this.cWidth / opt.width;
                this.scale = this.ratio;
                this.bWidth = this.cWidth;
                this.bHeight = this.cHeight;
                this.isSendCoord = true;
                this.style = {width: this.cWidth + 'px', height: this.cHeight + 'px'};
                this.dragData = {x: 0, posX: 0, y: 0, posY: 0};
                this.mapSrc = opt.src;
                this.loading = false;
                this.scaleImage();
                this.$emit("change", {
                    type: "size",
                    result: {width: this.bWidth, height: this.bHeight}
                });
            },
            loadErr () {
                if(isString(this.src) && this.src.length > 0){
                    this.warnText = "图片加载不成功！";
                }else{
                    this.warnText = "请传入图片！";
                }
                let h = this.option.height || 800;
                this.height = h + 4;
                this.loading = false;
                this.warning = true;
            },
            pageX (ev) {
                return ev.pageX || ev.clientX + document.body.scrollLeft - document.body.clientLeft;
            },
            pageY (ev) {
                return ev.pageY || ev.clientY + document.body.scrollTop - document.body.clientTop;
            },
            stopAnimate () {
                clearInterval(this.tid3);
                this.tid3 = null;
            },
            startAnimate () {
                if(this.tid3 === null){
                    this.tid3 = setInterval(this.drawGraph, 25);
                }
            },
            getItem (node, callback) {
                let id = isNode(node) ? node.dataset.id : node;
                let rs = null;
                let stop = false;
                this.drawing.forEach((item, index) => {
                    if(!stop && item.id === id){
                        rs = item;
                        stop = true;
                        isFunction(callback) && callback(item, index);
                    }
                });
                return rs;
            },
            scaleImage (bool, ani) {
                if(bool){
                    this.cWidth = this.imgWidth * this.scale;
                    this.cHeight = this.imgHeight * this.scale;
                    if(ani && (this.dragData.posX !== 0 || this.dragData.posY !== 0)){
                        this.dragData.posX = 0;
                        this.dragData.posY = 0;
                        this.style = Object.assign({width: this.cWidth + 'px', height: this.cHeight + 'px'}, transform(300, 0, 0));
                    }else if(!ani){
                        this.isScroll = true;
                        this.dragData.x = (this.bWidth - this.cWidth) / 2 + this.dragData.posX;
                        this.dragData.y = (this.bHeight - this.cHeight) / 2 + this.dragData.posY;
                        this.style = Object.assign({width: this.cWidth + 'px', height: this.cHeight + 'px'}, transform(0, this.dragData.x, this.dragData.y));
                    }
                }
                this.stopAnimate();
                clearTimeout(this.tid1);
                this.tid1 = setTimeout(() => {
                    this.tid1 = null;
                    this.isSendCoord = true;
                    this.isScroll = false;
                    this.hoverID = null;
                    this.tips.hide();
                    this.menu.hide();
                    this.drawGraph(true);
                    this.animate && this.startAnimate();
                }, bool ? 200 : 10);
            },
            initCanvas () {
                this.canvasBg = this.$refs["draw-canvas-bg"];
                this.bgCtx = this.canvasBg.getContext("2d");
                this.ctx = this.$refs["draw-canvas"].getContext("2d");
                this.tempCtx = this.$refs["draw-canvas-temp"].getContext("2d");
                this.tempBgCtx = this.$refs["draw-canvas-temp-bg"].getContext("2d");
            },
            dragCanvas (ev) {
                this.dragData.moveX = this.pageX(ev) - this.dragData.cursorX;
                this.dragData.moveY = this.pageY(ev) - this.dragData.cursorY;
                this.dragData.x = (this.bWidth - this.cWidth) / 2 + this.dragData.posX + this.dragData.moveX;
                this.dragData.y = (this.bHeight - this.cHeight) / 2 + this.dragData.posY + this.dragData.moveY;
                this.style = Object.assign({}, this.style, transform(0, this.dragData.x, this.dragData.y));
            },
            freeCanvas () {
                this.dragData.posX += this.dragData.moveX;
                this.dragData.posY += this.dragData.moveY;
                document.removeEventListener("mousemove", this.dragCanvas);
                document.removeEventListener("mouseup", this.freeCanvas);
                this.isMove = false;
                this.isSendCoord = true;
                this.drawGraph();
            },
            contextMenu (ev) {
                if(this.drawStatus || this.view) return;
                this.areaNode = ev.target;
                this.tips.hide();
                this.menu.show(this.pageX(ev) + 10, this.pageY(ev) + 10);
                ev.preventDefault();
            },
            linearScale (scale) {
                return new Promise(resolve => {
                    let mod = scale - this.scale;
                    if(mod === 0){
                        resolve();
                        return;
                    }
                    let cur = this.scale;
                    delay(p => {
                        this.scale = cur + p * mod;
                        this.scaleImage(true);
                        if(p === 1){
                            resolve();
                        }
                    }, 300).ani(true);
                });
            },
            setDeviceMap (index = 0, list, next = true) {
                let map = this.deviceMap;
                map.next = next;
                map.index = index;
                map.list = isArray(list) ? list : map.list;
                let stop = false;
                if(isObject(map.list[index]) && !map.list[index].use){
                    map.type = map.list[index].type;
                    this.$emit("change", {
                        type: "selectDevice",
                        text: "选择设备",
                        result: Object.assign({}, map.list[index])
                    });
                    return;
                }
                map.list.forEach((res, i) => {
                    if(!stop && !res.use){
                        stop = true;
                        map.index = i;
                        map.type = res.type;
                        this.$emit("change", {
                            type: "selectDevice",
                            text: "选择设备",
                            result: Object.assign({}, res)
                        });
                    }
                });
                if(!stop){
                    map.type = null;
                }
            },
            moveTo (coord, list, next = true, scale = 0.8) {//布点关联
                try{
                    let stop = false;
                    let rs = null;
                    this.drawing.forEach(item => {
                        if(!stop && item.coord.toString() === coord.toString()){
                            rs = item;
                            stop = true;
                        }
                    });
                    if(rs === null){
                        dialogManager.toast("无关联场区！");
                        return false;
                    }
                    isObject(rs) && this.linearScale(scale)
                        .then(() => {
                            let x = 0,y = 0;
                            this.stationID = rs.id;
                            if(rs.share === "poly"){
                                let len = rs.records.length;
                                let fObj = rs.records[0];
                                let lObj = rs.records[len > 3 ? len - 2 : len - 1];
                                x = this.getVal(fObj.x) + this.getVal((lObj.x - fObj.x) / 2);
                                y = this.getVal(fObj.y) + this.getVal((lObj.y - fObj.y) / 2);
                            }else if(rs.share === "circle"){
                                x = this.getVal(rs.x);
                                y = this.getVal(rs.y);
                            }else{
                                x = this.getVal(parseFloat(rs.x) + rs.posX / 2);
                                y = this.getVal(parseFloat(rs.y) + rs.posY / 2);
                            }
                            let moveX = -(x - this.bWidth / 2);
                            let moveY = -(y - this.bHeight / 2);

                            this.dragData.posX = moveX - (this.bWidth - this.cWidth) / 2;
                            this.dragData.posY = moveY - (this.bHeight - this.cHeight) / 2;
                            this.style = Object.assign({}, this.style, transform(300, moveX, moveY));
                            this.drawGraph(true);
                            this.setDeviceMap(0, list, next);
                        });
                }catch(e){
                    console.log(e);
                }
            },
            finish () {
                let result = [];
                this.drawing.forEach(item => {
                    let rs = Object.assign({}, item);
                    delete rs.id;
                    result.push(rs);
                });
                this.$emit("change", {
                    type: "finish",
                    text: "完成",
                    result: result
                });
            },
            triggerMap (ev) {
                if(this.drawStatus) return;
                let rs = this.getItem(ev.target);
                if(isObject(rs)){
                    let nRs = Object.assign({}, rs);
                    delete nRs.id;
                    this.$emit("change", {
                        type: "tapMap",
                        text: "点击场区",
                        result: nRs
                    });
                }
            },
            getStations (px, py, fn) {
                let result = null;
                this.drawing.forEach(rs => {
                    if(isArray(rs.stations)){
                        let stop = false;
                        rs.stations.forEach((item, index) => {
                            if(stop) return;
                            let img = this.showColorIcon ? {width: 42, height: 42} : this.icons[item.coord];
                            if(img){
                                let w = this.getVal(img.width) / 2;
                                let h = this.getVal(img.height) / 2;
                                let x = this.getVal(item.x);
                                let y = this.getVal(item.y);
                                if(px >= x - w && px <= x + w && py >= y - h && py <= y + h){
                                    result = item.name;
                                    isFunction(fn) && fn(rs, index);
                                    stop = true;
                                }
                            }
                        });
                    }
                });
                return result;
            },
            showStationMsg (ev) {
                let offset = getOffset(this.canvasBg);
                let result = false;
                this.getStations(this.pageX(ev) - offset.left, this.pageY(ev) - offset.top, (rs, index) => {
                    let item = rs.stations[index];
                    let name = item.name;
                    if (isString(name) && name.length > 0) {
                        let x = this.pageX(ev), y = this.pageY(ev);
                        if (this.tipMap.station) {
                            this.tips.postMessage(name);
                            this.tips.show(x + 20, y + 20);
                        }
                        this.$emit("change", {
                            type: "stationHover",
                            result: {x: x, y: y, key: item.id, name: item.name, share: "station"}
                        });
                        result = true;
                    }
                });
                return result;
            },
            drawMouseMove (ev) {
                clearTimeout(this.tid2);
                this.tid2 = setTimeout(() => {
                    if(!this.showStationMsg(ev)){
                        this.tips.hide();
                        this.$emit("change", {
                            type: "stationOut",
                        });
                    }
                }, 50);
            },
            tipsHover (ev) {
                if(this.drawStatus || this.isScroll || this.stationID !== null || ev.target === this.areaNode) return;
                clearTimeout(this.tid2);
                this.tid2 = setTimeout(() => {
                    if(this.showStationMsg(ev)) return;
                    let rs = this.getItem(ev.target);
                    this.tid2 = null;
                    if(isObject(rs) && isString(rs.desc) && rs.desc.length > 0){
                        let x = this.pageX(ev), y = this.pageY(ev);
                        if(this.tipMap.area){
                            this.tips.postMessage(rs.desc);
                            this.tips.show(x + 20, y + 20);
                        }
                        this.$emit("change", {
                            type: "areaHover",
                            result: {x: x, y: y, key: rs.coord, name: rs.name, share: rs.share}
                        });
                    }else{
                        this.tips.hide();
                    }
                }, 50);
            },
            mouseOver (ev) {
                this.isMapArea = this.drawStatus;
                if(this.drawStatus || this.isScroll) return;
                this.hoverID = ev.target.dataset.id;
                this.drawGraph();
                let rs = this.getItem(this.hoverID);
                this.$emit("change", {
                    type: "mouseOver",
                    result: {x: this.pageX(ev), y: this.pageY(ev), key: rs.coord, name: rs.name, share: rs.share}
                });
            },
            mouseOut () {
                this.isMapArea = false;
                if(this.drawStatus) return;
                clearTimeout(this.tid2);
                this.tips.hide();
                this.hoverID = null;
                this.drawGraph();
                this.$emit("change", {
                    type: "mouseOut"
                });
            },
            clearIcon (key, x, y) {
                let suc = false;
                let img = this.icons[key];
                if(img) {
                    let w = this.getVal(img.width) / 2;
                    let h = this.getVal(img.height) / 2;
                    this.drawing.forEach(rs => {
                        if(!suc && isArray(rs.stations)){
                            rs.stations.forEach((item, index) => {
                                if(!suc && x >= item.x - w  && x <= item.x + w && y >= item.y - h && y <= item.y + h){
                                    rs.stations.splice(index, 1);
                                    suc = true;
                                }
                            });
                        }
                    });
                }
                return suc;
            },
            drawIcon (coord, x, y) {
                if(this.showColorIcon){
                    let img = this.option.colorIcons[coord];
                    if(img){
                        this.drawColorIcon(x, y, this.getVal(21), img, 1);
                    }
                }else{
                    let img = this.icons[coord];
                    if(img){
                        let w = this.getVal(img.width);
                        let h = this.getVal(img.height);
                        this.ctx.globalAlpha = 1;
                        this.ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
                    }
                }
            },
            drawAnimateIcon (key, coord, x, y, ani, small) {
                let img = this.option.colorIcons[coord];
                if(img) {
                    let r = this.getVal(21);
                    if(ani){
                        if(!isObject(this.animateMap[key])){
                            this.animateMap[key] = {start: {add: true, r: 0, opacity: 0.5}, end: {add: true, r: 0, opacity: 0}};
                        }
                        let obj = this.animateMap[key];
                        let start = obj.start;
                        let end = obj.end;

                        if (start.add) {
                            start.r++;
                            end.opacity -= 0.01;
                        }

                        if (start.add && start.r >= 20) {
                            end.r = start.r;
                            end.opacity += 0.02;
                        }

                        if (start.add && start.r >= 30) {
                            end.r = start.r;
                            start.add = false;
                        }

                        if (!start.add && end.add) {
                            end.opacity += 0.05;
                            start.opacity -= 0.005;
                            end.r++;
                        }

                        if (!start.add && end.r >= 60) {
                            end.add = false;
                        }

                        if (!end.add) {
                            start.opacity -= 0.02;
                            end.opacity -= 0.002;
                        }

                        if (start.opacity <= 0) {
                            start.add = true;
                            end.add = true;
                            start.r = 0;
                            start.opacity = 0.5;
                        }

                        start.opacity = Math.max(0, start.opacity);
                        end.opacity = Math.max(0, Math.min(0.25, end.opacity));


//                    if(start.add){
//                        start.r++;
//                    }else{
//                        start.opacity -= 0.02;
//                    }
//                    if(start.add && start.r >= 30){
//                        start.add = false;
//                    }else if(start.opacity <= 0.25){
//                        start.r = 0;
//                        start.opacity = 0.5;
//                        start.add = true;
//                    }
//                    if(end.add){
//                        end.r++;
//                    }else{
//                        end.opacity -= 0.02;
//                    }
//                    if(end.add && end.r >= 60){
//                        end.add = false;
//                    }else if(end.opacity <= 0){
//                        end.r = 30;
//                        end.opacity = 0.25;
//                        end.add = true;
//                    }
                        this.drawColorIcon(x, y, r + this.getVal(end.r) / (small ? 2 : 1), img, end.opacity);
                        this.drawColorIcon(x, y, r + this.getVal(start.r) / (small ? 2 : 1), img, start.opacity);
                    }
                    this.drawColorIcon(x, y, r, img, 1);
                }
            },
            drawColorIcon (x, y, r, type, opacity) {
                try{
                    let obj = this.colorIcons[type];
                    this.ctx.save();
                    this.ctx.shadowColor = obj.shadowColor;
                    this.ctx.shadowBlur = 5;
                    let colors = this.ctx.createRadialGradient(x, y, 0, x, y, r);
                    colors.addColorStop(0, obj.start);
                    colors.addColorStop(1, obj.end);
                    this.ctx.globalAlpha = opacity;
                    this.ctx.fillStyle = colors;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, r, 0, 360, false);
                    this.ctx.fill();
                    this.ctx.restore();
                }catch(e){
                    console.log("创建失败");
                }
            },
            drawStroke (ctx, id) {
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1;
                ctx.strokeStyle = this.hoverID === id ? (this.stationID === id ? this.colors.stationHoverColor : this.colors.strokeHoverColor) : this.colors.strokeColor;
                ctx.stroke();
            },
            drawFill (ctx, id) {
                ctx.globalAlpha = this.colors.fillOpacity;
                ctx.fillStyle = this.hoverID === id ? (this.stationID === id ? this.colors.stationFillHoverColor : this.colors.fillHoverColor) : this.colors.fillColor;
                ctx.fill();
            },
            drawText (ctx, rs){
                if(isString(rs.text) && rs.text.length > 0){
                    ctx.fillStyle = this.colors.textColor;
                    ctx.font="bold 18px Microsoft YaHei";
                    ctx.globalAlpha = 1;
                    if(rs.share === "circle"){
                        ctx.fillText(rs.text, this.getVal(rs.x - rs.r) + 10, this.getVal(rs.y) + 20);
                    }else if(rs.share === "poly"){
                        let obj = rs.records[0];
                        ctx.fillText(rs.text, this.getVal(obj.x) + 10, this.getVal(obj.y) + 20);
                    }else{
                        ctx.fillText(rs.text, this.getVal(rs.x) + 10, this.getVal(rs.y) + 20);
                    }
                }
            },
            drawMap (shape, coords, id) {
                let area = document.createElement("area");
                area.shape = shape;
                area.coords = coords;
                area.dataset.id = id;
                if(this.stationID === null){
                    area.href = "javascript:void(0)";
                }
                this.$refs.map.appendChild(area);
            },
            drawPolygon () {
                let self = this;
                let rs = self.record;
                circle(self.tempBgCtx, rs.x, rs.y, 5);
                self.tempBgCtx.strokeStyle="#f00";
                self.tempBgCtx.fillStyle="#994fcb";
                self.tempBgCtx.lineWidth = 4;
                self.tempBgCtx.stroke();
                self.tempBgCtx.fill();
                let len = self.records.length;
                if(len >= 3){
                    let fObj = self.records[0];
                    let lObj = self.records[len - 1];
                    if(Math.abs(fObj.x - lObj.x - lObj.posX) <= 8 && Math.abs(fObj.y - lObj.y - lObj.posY) <= 8){
                        let rs = {id: getUniqueId(), share: "poly", records: self.records, isDraw: true, coord: self.isRelate ? "" : "COORD_" + Date.now()};
                        self.drawing.push(rs);
                        self.drawGraph(true);
                        self.records = [];
                        self.record = {};
                        self.drawStatus = false;
                        document.removeEventListener("mousemove", self.mouseMove);
                        return true;
                    }
                }
                return false;
            },
            findUse (map) {
                if(map.next && map.index < map.list.length - 1){
                    map.index++;
                    if(map.list[map.index].use){
                        this.findUse(map);
                    }else{
                        map.type = map.list[map.index].type;
                    }
                }else{
                    map.type = null;
                }
            },
            mouseDown (ev) {
                let self = this;
                if(!self.drawStatus || this.isMapArea){
                    if(ev.buttons === 2 && this.hoverID === null){
                        this.dragData.cursorX = this.pageX(ev);
                        this.dragData.cursorY = this.pageY(ev);
                        this.dragData.moveX = 0;
                        this.dragData.moveY = 0;
                        this.isMove = true;
                        this.isSendCoord = true;
                        document.addEventListener("mousemove", this.dragCanvas);
                        document.addEventListener("mouseup", this.freeCanvas);
                        return;
                    }
                    if(this.view || this.isMapArea) return;
                    if(ev.buttons === 1 && this.hoverID !== null && this.stationID !== null){
                        this.menu.hide();
                        let map = this.deviceMap;
                        let key = map.type;
                        let offset = getOffset(self.canvasBg);
                        const getMaxVal = function(value){
                            return formatNumber(value / self.scale, 2);
                        };
                        let x = self.pageX(ev) - offset.left;
                        let y = self.pageY(ev) - offset.top;
                        if(self.getStations(x, y, (rs, index) => {
                                let id = rs.stations[index].id;
                                let stop = false;
                                map.list.forEach((r, i) => {
                                    if(!stop && r.id === id){
                                        map.index = i;
                                        stop = true;
                                        map.type = map.list[map.index].type;
                                        this.$emit("change", {
                                            type: "delStation",
                                            text: "删除布点",
                                            result: Object.assign({index: i, station: rs.coord}, map.list[map.index])
                                        });
                                    }
                                });
                                rs.stations.splice(index, 1);
                            }) !== null){
                            this.drawGraph(true);
                            return;
                        }else if(key === null){
                            dialogManager.toast("请选择设备！");
                            return;
                        }else if(this.hoverID !== this.stationID){
                            dialogManager.toast("当前场区未选择！");
                            return;
                        }
                        self.getItem(self.stationID, item => {
                            let icons = self.option.icons;
                            if(icons[key]){
                                if(!isArray(item.stations)){
                                    item.stations = [];
                                }
                                let res = map.list[map.index];
                                item.stations.push({coord: key, id: res.id, x: getMaxVal(x), y: getMaxVal(y), name: res.name});
                                let result = Object.assign({index: map.index, station: item.coord}, res);
                                self.findUse(map);
                                result.next = map.key === null ? null : Object.assign({index: map.index}, map.list[map.index]);
                                this.$emit("change", {
                                    type: "addStation",
                                    text: "添加布点",
                                    result: result
                                });
                                this.drawGraph(true);
                            }else{
                                dialogManager.toast("当前无图标！");
                            }
                        });
                    }
                }
                let filter = self.type === null || ev.button > 1 || this.hoverID !== null || this.warning || this.loading;
                if(filter && (!self.drawStatus || self.type !== "polygon")) return;
                let rs = self.record;
                self.drawStatus = true;
                if(rs.polygon){
                    self.records.push(Object.assign({}, rs));
                    self.tempBgCtx.beginPath();
                    self.tempBgCtx.moveTo(rs.x, rs.y);
                    self.tempBgCtx.lineTo(rs.x + rs.posX, rs.y + rs.posY);
                    self.tempBgCtx.closePath();
                    self.drawStroke(self.tempBgCtx);
                }
                let offset = getOffset(self.canvasBg);
                rs.cursorX = self.pageX(ev);
                rs.cursorY = self.pageY(ev);
                rs.x = rs.cursorX - offset.left;
                rs.y = rs.cursorY - offset.top;
//                if(self.stationID !== null && self.getStations(rs.x, rs.y, (rs, index) => rs.stations.splice(index, 1)) !== null){
//                    self.drawGraph(true);
//                    return;
//                }
                rs.posX = 0;
                rs.posY = 0;
                rs.r = 0;
                if(self.type === "polygon"){
                    if(self.drawPolygon()){
                        return;
                    }
                }
                if(self.records.length === 0){
                    document.addEventListener("mousemove", self.mouseMove);
                }
                if(self.type !== "polygon"){
                    document.addEventListener("mouseup", self.mouseUp);
                }
                ev.preventDefault();
            },
            mouseMove (ev) {
                let self = this;
                let rs = self.record;
                let moveX = self.pageX(ev);
                let moveY = self.pageY(ev);
                rs.posX = moveX - rs.cursorX;
                rs.posY = moveY - rs.cursorY;
                rs.r = Math.sqrt(rs.posX * rs.posX + rs.posY * rs.posY);
                self.tempCtx.clearRect(0, 0, self.cWidth, self.cHeight);
                if(self.type === "oval"){
                    oval(self.tempCtx, rs.x, rs.y, rs.posX * 2, rs.posY * 2);
                    self.drawStroke(self.tempCtx);
                    self.drawFill(self.tempCtx);
                }else if(self.type === "circle"){
                    circle(self.tempCtx, rs.x, rs.y, rs.r);
                    self.drawStroke(self.tempCtx);
                    self.drawFill(self.tempCtx);
                }else if(self.type === "square"){
                    self.drawFill(self.tempCtx);
                    self.tempCtx.fillRect(rs.x, rs.y, rs.posX, rs.posY);
                    self.tempCtx.beginPath();
                    self.drawStroke(self.tempCtx);
                    self.tempCtx.strokeRect(rs.x, rs.y, rs.posX, rs.posY);
                    self.tempCtx.closePath();
                }else if(self.type === "polygon"){
                    rs.polygon = true;
                    self.tempCtx.beginPath();
                    self.tempCtx.moveTo(rs.x, rs.y);
                    self.tempCtx.lineTo(rs.x + rs.posX, rs.y + rs.posY);
                    self.tempCtx.closePath();
                    self.drawStroke(self.tempCtx);
                }
                ev.preventDefault();
            },
            mouseUp () {
                let self = this;
                let rs = self.record;
                rs.isDraw = true;
                self.drawStatus = false;
                document.removeEventListener("mousemove", self.mouseMove);
                document.removeEventListener("mouseup", self.mouseUp);
                self.tempCtx.clearRect(0, 0, self.cWidth, self.cHeight);
                if(Math.abs(rs.posX) < 5 && Math.abs(rs.posY) < 5){
                    self.record = {};
                    self.records = [];
                    return;
                }
                rs.id = getUniqueId();
                rs.coord = self.isRelate ? "" : "COORD_" + Date.now();
                if(self.type === "oval"){
                    rs.share ="oval";
                }else if(self.type === "circle"){
                    rs.share ="circle";
                }else if(self.type === "square"){
                    rs.share ="rect";
                }
                self.drawing.push(rs);
                self.drawGraph(true);
                self.record = {};
                self.records = [];
            },
            formatData () {
                let result = [];
                let self = this;
                const getMaxVal = function(value){
                    return formatNumber(value / self.scale, 2);
                };
                self.drawing.forEach(rs => {
                    if(!isBoolean(rs.isDraw)) {
                        result.push(rs);
                        return;
                    }
                    let obj = {coord: rs.coord, share: rs.share, desc: rs.desc, stations: rs.stations};
                    if(rs.share === "poly"){
                        let records = [];
                        rs.records.forEach(item => {
                            records.push({
                                x: getMaxVal(item.x),
                                y: getMaxVal(item.y),
                                posX: getMaxVal(item.posX),
                                posY: getMaxVal(item.posY)
                            });
                        });
                        obj.records = records;
                    }else{
                        obj.x = getMaxVal(rs.x);
                        obj.y = getMaxVal(rs.y);
                        obj.r = getMaxVal(rs.r);
                        obj.posX = getMaxVal(rs.posX);
                        obj.posY = getMaxVal(rs.posY);
                    }
                    result.push(obj);
                });
                return result;
            },
            getVal (value) {
                return formatNumber(value * this.scale, 2);
            },
            emitCoord (share, name, key, x, y, offset) {
                if(this.isSendCoord){
                    this.$emit("change", {
                        type: "coord",
                        text: "座标点",
                        result: {
                            share: share,
                            name: name,
                            key: key,
                            x: x + offset.left,
                            y: y + offset.top
                        }
                    });
                }
            },
            drawGraph (bool) {
                this.ctx.clearRect(0, 0, this.cWidth, this.cHeight);
                this.setCanvasBg();
                if(bool) this.$refs.map.innerHTML = "";
                let offset = this.isSendCoord ? getOffset(this.canvasBg) : null;
                this.drawing = this.formatData();
                this.showArea && this.drawing.forEach(rs => {
                    rs.id = rs.id || getUniqueId();
                    this.drawText(this.ctx, rs);
                    if(rs.share === "oval"){
                        let x = this.getVal(rs.x), y = this.getVal(rs.y);
                        oval(this.ctx, x, y, this.getVal(rs.posX) * 2, this.getVal(rs.posY) * 2);
                        this.drawStroke(this.ctx);
                        this.drawFill(this.ctx);
                        oval(this.bgCtx, x, y, this.getVal(rs.posX) * 2, this.getVal(rs.posY) * 2);
                        this.bgCtx.fill();
                    }else if(rs.share === "circle"){
                        let x = this.getVal(rs.x), y = this.getVal(rs.y);
                        circle(this.ctx, x, y, this.getVal(rs.r));
                        this.drawStroke(this.ctx, rs.id);
                        this.drawFill(this.ctx, rs.id);
                        circle(this.bgCtx, x, y, this.getVal(rs.r));
                        this.bgCtx.fill();
                        bool && this.drawMap(rs.share, `${x},${y},${this.getVal(rs.r)}`, rs.id);
                    }else if(rs.share === "rect"){
                        let x = this.getVal(rs.x), y = this.getVal(rs.y);
                        this.ctx.beginPath();
                        this.drawFill(this.ctx, rs.id);
                        this.ctx.fillRect(x, y, this.getVal(rs.posX), this.getVal(rs.posY));
                        this.ctx.beginPath();
                        this.drawStroke(this.ctx, rs.id);
                        this.ctx.strokeRect(x, y, this.getVal(rs.posX), this.getVal(rs.posY));
                        this.ctx.closePath();
                        this.bgCtx.fillRect(x, y, this.getVal(rs.posX), this.getVal(rs.posY));
                        bool && this.drawMap(rs.share, `${x},${y},${x+this.getVal(rs.posX)},${y+this.getVal(rs.posY)}`, rs.id);
                    }else if(rs.share === "poly"){
                        let obj = rs.records[0];
                        let len = rs.records.length;
                        let x = this.getVal(obj.x), y = this.getVal(obj.y);
                        let coords = `${x},${y}`;
                        this.tempCtx.clearRect(0, 0, this.cWidth, this.cHeight);
                        this.tempBgCtx.clearRect(0, 0, this.cWidth, this.cHeight);
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, y);
                        this.bgCtx.beginPath();
                        this.bgCtx.moveTo(x, y);
                        rs.records.forEach((item, index) => {
                            if(index < len - 1){
                                this.ctx.lineTo(this.getVal(item.x) + this.getVal(item.posX), this.getVal(item.y) + this.getVal(item.posY));
                                this.bgCtx.lineTo(this.getVal(item.x) + this.getVal(item.posX), this.getVal(item.y) + this.getVal(item.posY));
                                coords += `,${this.getVal(item.x) + this.getVal(item.posX)},${this.getVal(item.y) + this.getVal(item.posY)}`;
                            }
                        });
                        bool && this.drawMap(rs.share, coords, rs.id);
                        this.ctx.closePath();
                        this.drawStroke(this.ctx, rs.id);
                        this.drawFill(this.ctx, rs.id);
                        this.bgCtx.closePath();
                        this.bgCtx.fill();
                    }
                });

                 this.drawing.forEach(rs => {
                     let bool = rs.share === "poly";
                    this.emitCoord(rs.share, rs.name, rs.coord, this.getVal(bool ? rs.records[0].x : rs.x), this.getVal(bool ? rs.records[0].y : rs.y), offset);
                    if(isArray(rs.stations)){
                        rs.stations.forEach(item => {
                            let x = this.getVal(item.x), y = this.getVal(item.y);
                            this.emitCoord("station", item.name, item.id, x, y, offset);
                            if(this.showDevice){
                                if(this.animate){
                                    this.drawAnimateIcon(item.id, item.coord, x, y, item.ani, item.small);
                                }else{
                                    this.drawIcon(item.coord, x, y);
                                }
                            }
                        });
                    }
                });
                this.isSendCoord = false;
            },
            setCanvasBg () {
                this.bgCtx.globalCompositeOperation = "copy";
                this.bgCtx.fillStyle = this.colors.bgColor;
                this.bgCtx.globalAlpha = this.colors.bgOpacity;
                this.bgCtx.fillRect(0, 0, this.cWidth, this.cHeight);
                this.bgCtx.globalAlpha = 1;
                this.bgCtx.globalCompositeOperation = "destination-out";
            },
            changeType (type, index) {
                if(this.type === type){
                    this.type = null;
                    this.selected = null;
                }else{
                    this.type = type;
                    this.selected = index;
                }

            },
            waiting () {
                this.warning = false;
                this.loading = true;
            },
            clear (bool) {
                let callback = function(self){
                    self.ctx.clearRect(0, 0, self.cWidth, self.cHeight);
                    self.setCanvasBg();
                    self.drawing = [];
                    self.$refs.map.innerHTML = "";
                };
                if(bool === true){
                    callback(this);
                }else{
                    dialogManager.confirm("确定要全部清空吗?")
                        .then(() => {
                            callback(this);
                        });
                }
            },
            cancelStation () {
                this.stationID = null;
                this.drawGraph(true);
                this.$emit("change", {
                    type: "cancelStation",
                    text: "取消布点",
                    result: {}
                });
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import "../../../js/plugin/scss/static";
    .m-draw-canvas{
        border: 1px solid transparent;
        box-shadow: 20px 20px 20px rgba($bg39, 0.05);
    }
    .draw-but-group{
        text-align: left;
        margin: 15px 0;
        .btn{
            display: inline-block;
            background-color: $bg1;
            border: 1px solid $border18;
            color: $color14;
            cursor: pointer;
            line-height: 34px;
            border-radius: 5px;
            padding: 0 20px;
            font-size: $fs14;
            margin-right: 10px;
            i{
                margin-right: 8px;
            }
            .square{
                @include mix-square;
            }
            .circle{
                @include mix-circle;
            }
            .polygon{
                @include mix-polygon;
            }
            .pause{
                @include mix-pause-draw;
            }
            .clear{
                @include mix-clear;
            }
            &:hover,&.checked{
                .square{
                    @include mix-square-selected;
                }
                .circle{
                    @include mix-circle-selected;
                }
                .polygon{
                    @include mix-polygon-selected;
                }
                .pause{
                    @include mix-pause-draw-selected;
                }
                background-color: rgba($bg28, 0.8);
                color: $color1;
            }
            &.checked{
                background-color: $bg28;
            }
        }
        .gray{
            border: 1px solid $border6;
            color: $color2;
            &:hover{
                background: none;
                border: 1px solid $border6;
                color: $color2;
            }
        }
    }
    .draw-canvas-group{
        position: relative;
        width: 1200px;
        height: 800px;
        overflow: hidden;
        &.view{
            cursor: default;
        }
        &.move{
            cursor: move;
        }
        cursor: url("/common/images/noc/move.cur") 12 12, default;
    }
    .m-loading{
        @include center;
    }
    .m-warn{
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background-color: $bg1;
        span{
            @include center;
            font-size: $fs16;
            color: $color17;
            font-weight: bold;
        }
    }
    .draw-canvas,.canvas-image-map{
        position: absolute;
        left: 0;
        top: 0;
    }
    .draw-canvas-fixed{
        position: relative;
        overflow: hidden;
        border: 2px solid rgba($border18, 0.5);
    }
    .canvas-image-map{
        opacity: 0;
    }
    map{
        cursor: url("/common/images/noc/location.png") 8 7, default;
    }
</style>