import React, { Component } from 'react';

import styled from 'styled-components';

import { vw } from '../../utils';


const Wrapper = styled.div`
    margin: 0 auto;
    width: ${vw(318)};
    padding-top: 3vw;
`;

const Score = styled.div`
    text-align: center;
    
    width: 16vw;
    height: ${vw(100)};
    line-height: ${vw(100)};

    font-size: 5.87vw;
    color: rgba(30,30,31,1);
`

const MineScore = styled(Score)`
    position: absolute;
    left: 1vw;
`;

const OpponentScore = styled(Score)`
    position: absolute;
    right: 1vw;
`;

const Board = styled.div`
    position: relative;
    width: ${vw(318)};
    height: ${vw(100)};
    background-image: url(${require('./vs.png')});
    background-size: cover;
`;

const Countdown = styled.div`
    height: 7vw;
    line-height: 7vw;
    text-align: center;
    color: #FF3A3A;
`

export default class ScoreBoard extends Component {
    render() {
        const {mine, opponent, time, ...rest}  = this.props;
        return <div {...rest}>
            <Wrapper>
                <Board>
                    <MineScore>{mine}</MineScore>
                    <OpponentScore>{opponent}</OpponentScore>
                </Board>
                <Countdown>{time}</Countdown>
            </Wrapper>
        </div>
    }
}