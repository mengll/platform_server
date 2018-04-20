import React, { Component } from 'react';

import styled, { css } from 'styled-components';

const Colors = {
    win: 'rgba(247,45,81,1)',
    lose: 'rgba(103,103,103,1)',
    draw: 'rgba(53,134,255,1)',
};

const Label = styled.div`
    position: relative;
    margin: 0 auto;
    margin-top: -4vw;

    height: 13vw;
    width: 51vw;
    background-size: cover;
    background-image: ${({ type }) => `url(${require(`./label_${type}.png`)});`}

    font-size: 5.6vw;
    color: rgba(255,248,209,1);
    line-height: 13vw;
    text-align: center;
`;

const Border = styled.div`
    position: relative;
    z-index: 1;
    margin: 0 auto;

    box-sizing: border-box;
    width: 27vw;
    height: 27vw;
    border-radius: 13.5vw;
    padding: 1vw;
    background: ${({ type }) => Colors[type]};
`;

const Avatar = styled.div`
    box-sizing: border-box;

    width: 25vw;
    height: 25vw;
    border-radius: 12.5vw;
    border: 1vw solid rgba(255,255,255,1);
    background-color: rgba(162,162,162,1);

    background-image: url(${props => props.image});
    background-size: cover;
`;

const Texts = {
    win: '胜　利',
    lose: '失　败',
    draw: '平　局',
}

export default class Badge extends Component {
    render() {
        const {type, avatar, ...rest} = this.props;
        return (
            <div {...rest}>
                <Border type={type}>
                    <Avatar image={avatar}></Avatar>
                </Border>
                <Label type={type}>{ Texts[type] }</Label>
            </div>
        )
    }
}