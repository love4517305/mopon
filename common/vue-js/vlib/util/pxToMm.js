/**
 * px转换mm
 */
import screenDPI from './screenDPI'
export default function (val, type = 'x') {
    let dpi = screenDPI();
    if(type === "y"){
        return  Math.round(val * 25.4 / dpi.y);
    }else{
        return Math.round(val * 25.4 / dpi.x);
    }
}
