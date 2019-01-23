/**
 * mm转换px
 */
import screenDPI from './screenDPI'
export default function (val, type = 'x') {
    let dpi = screenDPI();
    if(type === "y"){
        return  Math.round(val * dpi.y / 25.4);
    }else{
        return Math.round(val * dpi.x / 25.4);
    }
}
