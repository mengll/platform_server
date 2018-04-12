import React, { Component } from 'react';

import styled, { css } from 'styled-components';

const Colors = {
    success: 'rgba(247,45,81,1)',
    failure: 'white',
    draw: 'white',
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
`;

export default class Badge extends Component {
    render() {
        const {type, text, ...rest} = this.props;
        return (
            <div {...rest}>
                <Border type={type}>
                    <Avatar></Avatar>
                </Border>
                <Label type={type}>{ text }</Label>
            </div>
        )
    }
}