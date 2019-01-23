
/***************************
 * 功能：计算弧度转角度
 * ******/
export const toDeg = function(deg){
    let p = Math.PI / 180;
    return deg * p;
};

/***************************
 * 功能：绘制扇形
 * *****/
export const sector = function(ctx, x, y, r, sDeg, eDeg){
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, r, sDeg, eDeg);
    ctx.closePath();
    ctx.restore();
    return ctx;
};

/***************************
 * 功能：绘制椭圆
 * *****/
export const circle = function(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, toDeg(360));
    ctx.closePath();
};

/***************************
 * 功能：绘制椭圆
 * *****/
export const oval = function(ctx, x, y, width, height) {
    let k = (width/0.75)/2,h = height/2;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.bezierCurveTo(x + k, y - h, x + k, y + h, x, y + h);
    ctx.bezierCurveTo(x - k, y + h, x - k, y - h, x, y - h);
    ctx.closePath();
    return ctx;
};

/***************************
 * 功能：绘制五角星
 * *****/
export const drawStar = function(ctx, x, y, r){
    ctx.beginPath();
    for (let i = 0; i < 5; i++){
        let angle = i * 4 * Math.PI / 5;
        ctx.lineTo(x+ r * Math.sin(angle),y-r * Math.cos(angle));
    }
    ctx.closePath();
    return ctx;
};
