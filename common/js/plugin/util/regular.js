/**
正则验证
 **/
//----------------require--------------
module.exports = function() {
    var getType = require("lib/util/getType");

    var that = {
        mobile: function(){//手机
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /^((1[3-9]{1}[0-9]{1})+\d{8})$/;
            return reg.test(val);
        },
        phone:function(){//电话
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /^(((0\d{2,3}-)+\d{7,8})|((0\d{2,3})+\d{7,8})|(\+\d{6,20})|(\d{6,20})|((0\d{2,3}-)+\d{7,8}-)+\d{1,6})$/;
            return reg.test(val);
        },
        email:function(){//邮箱
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg1 = /@([a-zA-Z0-9_-])+\.([a-zA-Z0-9_-])+/;//防止输入过长的时候，卡死
            var reg2 = /^([a-zA-Z0-9_-]+[_|\_|\.]?)+@([a-zA-Z0-9_-])+\.([a-zA-Z0-9_-])+$/;
            if(reg1.test(val)){
                return reg2.test(val);
            }
            return false;
        },
        code:function(){//邮政编码验证
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /^(([1-9]{1})\d{5})$/;
            return reg.test(val);
        },
        idCard:function(){//身份证证验
            var v_card = arguments[0];
            if("undefined" == getType(v_card))return false;
            return getIDCardOK(v_card);
        },
        number:function(){//只能输入数字
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /^(-?\d+)$/;
            return reg.test(val);
        },
        double:function(){//小数或整数
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /^(-?\d+)\.?\d*$/;
            return reg.test(val);
        },
        url:function(){//网址
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /^((https|http|ftp|rtsp|mms)?:\/\/)+[A-Za-z0-9-]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/;
            return reg.test(val);
        },
        chinese:function(){//验证中文
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /([\u4E00-\u9FA5]|[\uFE30-\uFFA0])+/gi;
            return reg.test(val);
        },
        regEn:function(){//验证特殊字符
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /[`_=~!@#$%^&*()+<>?:"{},.\/;'[\]\-]/im;
            return reg.test(val);
        },
        regCn:function(){//验证特殊字符
            var val = arguments[0];
            if("undefined" == getType(val))return false;
            var reg = /[·！#￥（——）：；“”‘、，|《。》？、【】[\]]/im;
            return reg.test(val);
        }
    };

    function getIDCard(v_card){//15位转18位
        var IDCardGene = [2,4,8,5,10,9,7,3,6,1,2,4,8,5,10,9,7];
        var IDCardParity = ['1','0','X','9','8','7','6','5','4','3','2'];
        if(v_card.length == 15){
            var month = v_card.substring(8,10);//获得15位号码中的月份
            if(month<1||month>12){return v_card;}
            var year = "19" + v_card.substring(6,8);
            var day = v_card.substring(10,12);
            if(day<1||day>31){return v_card;}
            var Mday = 0;
            if(month==1||month==3||month==5||month==7||month==8||month==10||month==12){Mday = 31;}
            if(month==4||month==6||month==9||month==11){Mday = 30;}
            if(month==2){Mday = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) ? 29 : 28;}
            if(day>Mday){return v_card;}//判断日期是否正确

            //将15位的号码转换位17位
            var cardID17 = v_card.substring(0,6)+"19"+v_card.substring(6);
            var N = 0;
            var R = -1;
            var T = '0';//储存最后一个数字
            var j = 0;
            var cardID18="";
            //计算出第18位数字
            for (var i = 16; i >= 0; i--)
            {
                N += parseInt(cardID17.substring(i, i + 1)) * IDCardGene[j];
                j++;
            }
            R = N % 11;
            T = IDCardParity[R];
            cardID18 = cardID17 + T;
            return cardID18;
        }
        return v_card;
    }

    function getIDCardOK(v_card){
        v_card = getIDCard(v_card);
        if(v_card.length != 18) return false;
        var iW = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2,1];
        var iSum = 0;
        for( i=0;i<17;i++){
            var iC = v_card.charAt(i) ;
            var iVal = parseInt(iC);
            iSum += iVal * iW[i];
        }
        var iJYM = iSum % 11;
        var sJYM = '';
        if(iJYM == 0) sJYM = "1";
        else if(iJYM == 1) sJYM = "0";
        else if(iJYM == 2) sJYM = "x";
        else if(iJYM == 3) sJYM = "9";
        else if(iJYM == 4) sJYM = "8";
        else if(iJYM == 5) sJYM = "7";
        else if(iJYM == 6) sJYM = "6";
        else if(iJYM == 7) sJYM = "5";
        else if(iJYM == 8) sJYM = "4";
        else if(iJYM == 9) sJYM = "3";
        else if(iJYM == 10) sJYM = "2";
        var cCheck = v_card.charAt(17).toLowerCase();
        if( cCheck != sJYM){
            return false; //对不上就是假号码
        }
        return true;
    }

    return that;
};