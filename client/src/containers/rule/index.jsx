import React, { Component } from 'react'

import styled from 'styled-components';

import { Redirect } from 'react-router-dom';

import { vw } from '../../utils';

const Popup = styled.div`
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.6);
`;

const Center = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform:translateX(-50%) translateY(-50%);
    width: ${vw(600)};

`

const Wrapper = styled.div`
    height: ${vw(700)};
    border-radius: ${vw(20)};
    background-color: #fff;
`

const Title = styled.div`
      box-sizing: border-box;
      text-align: center;
      height: ${vw(110)};
      font-size: ${vw(38)};
      padding-top: ${vw(34)};
`

const Body = styled.div`
      box-sizing: border-box;
      height: ${vw(590)};
      padding-bottom: ${vw(30)};
      font-size: ${vw(28)};
`

const Content = styled.div`
      box-sizing: border-box;
      height: ${vw(560)};
      padding: ${vw(10)} ${vw(30)};
      color:#555;
      overflow-y: auto;
      line-height: 1.6;
`

const Close = styled.div`
    width: ${vw(80)};
    height: ${vw(80)};

    background-image: url(${require('./btn_close.png')});
    background-size: cover;
    
    margin: 0 auto;
    margin-top: ${vw(20)};
`

// .modal {
//     position: absolute;
//     left: 50%;
//     top: 50%;
//     transform:translateX(-50%) translateY(-50%);
//     width: ${vw(600)};
  
  
//     .modal__wrapper {
//       height: ${vw(700)};
//       border-radius: ${vw(20)};
//       background-color: #fff;
//     }
  
//     .modal__title {
//       box-sizing: border-box;
//       text-align: center;
//       height: ${vw(110)};
//       font-size: ${vw(38)};
//       padding-top: ${vw(34)};
//     }
  
//     .modal__body {
//       box-sizing: border-box;
//       height: ${vw(590)};
//       padding-bottom: ${vw(30)};
//       font-size: ${vw(28)};
//     }
  
//     .modal__content {
//       box-sizing: border-box;
//       height: ${vw(560)};
//       padding: ${vw(10)} ${vw(30)};
//       color:#555;
//       overflow-y: auto;
//       line-height: 1.6;
//     }
  
//     .modal__close {
//       .background("btn_close.png");
//       .center-block;
//       margin-top: ${vw(20)};
//     }
//}

class Modal extends Component {
    render() {
        const {title = null, body = null, ...rest} = this.props;

        return <Popup {...rest}>
            <Center>
                <Wrapper>
                    <Title>{title}</Title>
                    <Body>
                        <Content>
                            {body}
                        </Content>
                    </Body>
                </Wrapper>
                <Close onClick={this.props.onClose}/>
            </Center>
        </Popup>
    }
}

export default class Rule extends Component {
    state = {
        closed: false
    }

    render() {
        const { gameId } = this.props.match.params;
        if (this.state.closed) {
            return <Redirect to={`/game/${gameId}`}/>
        } else {
            return <Modal title={'游戏规则'} body={''} onClose={() => {
                this.setState({
                    closed: true
                })
            }}/>
        }
    }
}