import React, { Component } from 'react';

import styled from 'styled-components';

const Wrapper = styled.div`
    width: 19vw;
    padding-top: 3vw;
`;

const Avatar = styled.div`
    margin: 0 auto;
    box-sizing: border-box;
    width: 13vw;
    height: 13vw;
    border-radius: 6.5vw;
    border: 1vw solid ${props => props.mine ? 'rgba(255,166,60,1)' : 'rgba(78,157,255,1)'};
    
    background-image: url(${props => props.image});
    background-size: cover;
`;

const NickName = styled.div`
    margin: 0 auto;

    height: 5vw;
    width: 17vw;
    
    overflow: hidden;
    text-overflow: ellipsis;

    text-align: center;

    line-height: 5vw;
    color: rgba(30,30,31,1);
    font-size: 3.2vw;
`;


export default class Player extends Component {
    render() {
        const {name, mine, avatar, ...rest}  = this.props;
        return <div {...rest}>
            <Wrapper >
                <Avatar image={avatar} mine={mine}/>
                <NickName>{name}</NickName>
            </Wrapper>
        </div>
    }
}