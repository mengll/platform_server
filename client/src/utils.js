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