import axios from 'axios';
import qs from 'qs';

export const Unit = option => {
    const _option = {
        divisor: 75,
        unit: 'rem',
        precision: 6,
    };

    option = Object.assign({}, _option, option)

    return x => {
        return parseFloat((x / option.unit).toFixed(option.precision)).toString() + option.unit
    }
}

export const vw = Unit({divisor: 7.5, unit: 'vw'});


const match = x => navigator.userAgent.match(x) !== null;
export const env = {
    WEIXIN: match('MicroMessenger'),
    ANFENG_HELPER: match('anfan'),
    ANFENG_GAME: match('afgame'),
    ANFENG_SDK_ANDROID: match('anfeng_mobile_android_sdk'),
    ANFENG_SDK_IOS: match('anfeng_mobile_ios_sdk'),
    IOS: match(/iphone|ipod|ipad/ig),
}


export const request = async (url, params) => {
    const { data: {error_code: code = 500, data: payload = null, msg: message = null} } = await axios.post(url, qs.stringify(params));
    return {code, payload, message, success: code == 0};
}


