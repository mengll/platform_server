import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';

import { Toast } from 'antd-mobile'
import styled from 'styled-components';

import { env, vw } from '../../utils';

const  { wx } = window;

const Overlay = styled.div`
    z-index: 1000;
    position: absolute;
    left: 0; right: 0; top: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
`;

const Tips = styled.div`
    position: absolute;
    top: 0;
    right: ${vw(100)};

    width: ${vw(511)};
    height: ${vw(496)};
    background: url(${require('./share.png')});
    background-size: cover;
`;

class WeixinShare extends Component {
    static jssdk = new Promise(async resolve => {
        // const params = await request('/index.php?d=api&c=wechat&m=jssdk', {url: window.location.href });
        // wx.config({
        //     debug: false,
        //     appId: params.appId, // 必填，公众号的唯一标识
        //     timestamp: params.timestamp, // 必填，生成签名的时间戳
        //     nonceStr: params.nonceStr, // 必填，生成签名的随机串
        //     signature: params.signature, // 必填，签名，见附录1
        //     jsApiList: [
        //         'checkJsApi', //判断当前客户端版本是否支持指定JS接口
        //         'onMenuShareTimeline', //分享给好友
        //         'onMenuShareAppMessage', //分享到朋友圈
        //         'onMenuShareQQ' //分享到QQ
        //     ]
        // });
        //wx.ready(resolve);
    })

    state = {
        visible: false,
    }

    container = document.createElement('div');
    
    
    componentWillMount() {
        const {wx} = window;
        const {title, content, image, url, onSuccess = () => {}} = this.props;
        WeixinShare.jssdk.then(() => {
            wx.onMenuShareTimeline({ //分享到朋友圈
                title: title,
                desc: content, // 分享描述
                link: url,
                imgUrl: image,
                success: onSuccess
            });

            wx.onMenuShareAppMessage({ //分享到朋友
                title: title, // 分享标题
                desc: content, // 分享描述
                link: url, // 分享链接
                imgUrl: image, // 分享图标
                success: onSuccess
            });
        });
        document.body.appendChild(this.container);
    }

    componentWillUnmount() {
        document.body.removeChild(this.container);
    }
    
    handleOpen = e => {
        this.setState({visible: true});
    }

    handleClose = e => {
        e.stopPropagation();
        this.setState({visible: false});
    }

    render() {

        const children = (
            <Overlay onClick={this.handleClose}>
                <Tips/>
            </Overlay>
        )

        return (
            <div {...this.props} onClick={this.handleOpen}>
                <Fragment>
                    {
                        this.props.children
                    }
                    {
                        this.state.visible ? ReactDOM.createPortal(children, this.container) : null
                    }
                </Fragment>
            </div>
        )
    }
}

const BrowserShare = (props) => {
    Toast.info('请使用浏览器自带分享功能');
}

const AnfengGameShare = (props) => {
    const {title, content, image, url} = this.props;
    const data = {
        title,
        content,
        img: image,
        url,
        ext: { hack: 'NOT_EMPTY' }
    }
    return window.anfeng.share(JSON.stringify(data))
}

class Share extends Component {
    
    share() {
        switch (true) {
            case env.ANFENG_GAME: return AnfengGameShare();
            case env.WEIXIN: return WeixinShare();
            default: return BrowserShare();
        }
    }

    render() {
        return null;
    }
}



const container = document.createElement("div");
document.body.appendChild(container);

const share = React.createRef();

ReactDOM.render(<Share ref={share}/>, container);


export default share.current;

