import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { request } from '../../utils';

const Wrapper = styled.div`
    min-height: 100vh;
    background-color: #FFE2BF;
`;

const Title = styled.div`
    height: 32.4vw;
    background-image: url(${require('./title.png')});
    background-size: cover;
`

const Row = styled.div`
    display: flex;
`

const Col = styled.div`
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;

    flex: 1;

    height: 6vw;
    line-height: 6vw;

    font-size: 4.2vw;
    color: ${props => props.active ? 'rgba(255,84,0,1)' : 'rgba(30,30,31,1)'};

    margin: 1vw 0;

`;

const Head = styled(Col)`
    margin: 1vw 0;
    font-weight: bold;
`;

const Avatar = styled.div`
    width: 5vw;
    height: 5vw;
    border-radius: 2.5vw;

    background-image: url(${props => props.image});
    background-size: cover;
`

const NickName = styled.div`
    width: 25vw;
    overflow: hidden;
    margin-left: 2vw;
    text-overflow: ellipsis;
`

const Content = styled.div`
    position: absolute;
    top: 40vw;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
`

class Ranking extends Component {
    state = {
        ranking: []
    }

    async componentDidMount() {
        const gameId = this.props.gameId;
        const response = await request('/v1/game_result_list', {game_id: gameId});
        if (response.success) {
            this.setState({
                ranking: response.payload
            })
        }
    }

    render() {
        const ranking = this.state.ranking;
        return <Wrapper>
            <Title/>
            <Row>
                <Head>排名</Head>
                <Head>玩家</Head>
                <Head>胜点</Head>
            </Row>
            <Content>
            {
                ranking.map((item, index) => {
                    return <Row key={index}>
                        <Col active={index < 3}>{index + 1}</Col>
                        <Col><Avatar image={item.avatar}/><NickName>{item.nick_name}</NickName></Col>
                        <Col>{item.win_point}</Col>
                    </Row>
                })
            }
            </Content>
        </Wrapper>;
    }
}

export default class RankingRoute extends Component {
    render() {
        const {gameId} = this.props.match.params;
        if (gameId) {
            return <Ranking gameId={gameId}/>;
        } else {
            return <Redirect to="/" />;
        }
    }
}