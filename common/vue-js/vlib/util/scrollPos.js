/**
 * 获取滚动条的位置
 *
 * import scrollPos from "../util/scrollPos";
 * var pos = scrollPos(); // 也可以传入一个iframe的document对象
 * 得到 { top: 0, left: 0 }
 *
 */
export default function(oDocument) {
	oDocument = oDocument || document;
	let dd = oDocument.documentElement;
    let db = oDocument.body;
	return {
		top: Math.max(window.pageYOffset || 0, dd.scrollTop, db.scrollTop),
		left: Math.max(window.pageXOffset || 0, dd.scrollLeft, db.scrollLeft)
	};
};