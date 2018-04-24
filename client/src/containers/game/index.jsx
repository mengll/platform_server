import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import styled from 'styled-components';

import { AuthContext } from '../../context';

import { request } from '../../utils';

import client from '../../client';

const Wrapper = styled.div`
  box-sizing: border-box;
  min-height: 100vh;
  background: rgba(242,242,242,1);
`


const Header = styled.div`
  box-sizing: border-box;

  position: relative;
  width: 100vw;
  height: 21vw;
  background: #FFFFFF;

  padding: 2vw 3vw;
  margin-bottom: 1px;
`;


const Icon = styled.div`
  width: 17vw;
  height: 17vw;
  background: #EEEEEE;
  background-image: url(${require('./bottle-flip.jpg')});
  background-size: cover;
`

const Title = styled.div`
  position: absolute;
  left: 23vw;
  top: 6vw;

  height: 4vw;
  font-size: 4.27vw;
  color: rgba(48,48,48,1);
  line-height: 2.67vw;

`

const Description = styled.div`
  position: absolute;
  left: 23vw;
  top: 12vw;

  height: 3.6vw;
  font-size: 3.73vw;
  color: rgba(153,153,153,1);
  line-height: 2.67vw;
`

const RuleLink = styled(Link)`
  position: absolute;
  right: 3vw;
  top: 9vw;

  height: 3.47vw;
  font-size: 3.73vw;
  color: rgba(153,153,153,1);
  line-height: 2.67vw;
`

const Profile = styled.div`
  position: relative;

  width: 100vw;
  height: 64vw;
  background: #ffffff;

  margin-bottom: 2vw;
`

const Surround = styled.div`
  position: absolute;
  left: 8vw;
  top: 8vw;

  width: 84vw;
  height: 39vw;
  background-image: url(${require('./bg.png')});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
`

const Avatar = styled.div`
  position: absolute;
  left: 39vw;
  top: 17vw;

  width: 21vw;
  height: 21vw;

  border-radius: 10.5vw;

  background-color: #3586FF;

  background-image: url(${props => props.image});
  background-size: cover;
`

const Username = styled.div`
  position: absolute;
  
  top: 42vw;

  width: 100vw;
  height: 4.27vw;
  font-size: 4vw;
  color: rgba(48,48,48,1);
  line-height: 2.67vw;

  text-align: center;
`

const Record = styled.div`
  position: absolute;
  top: 51vw;

  width: 100vw;
  height: 3.6vw;

  font-size: 3.73vw;
  color: rgba(153,153,153,1);

  line-height: 2.67vw;

  text-align: center;
`

const Ranking = styled(Link)`
  position: relative;
  display: block;

  box-sizing: border-box;

  width: 100vw;
  height: 12vw;

  padding: 4vw 3vw;

  background: #FFFFFF;
`

const Text = styled.div`
  height: 4vw;
  font-size: 3.73vw;
  color: rgba(48,48,48,1);
  line-height: 4vw;
`

const RankingLink = styled.div`
  position: absolute;
  right: 3vw;
  top: 4vw;

  height: 4vw;
  font-size: 3.73vw;
  color: rgba(153,153,153,1);
  line-height: 4vw;

`

const Bottom = styled.div`
  padding: 12vw 12.5vw;
`

const MatchButton = styled(Link)`
  display: block;
  text-decoration: none;
  width: 75vw;
  height: 13vw;
  line-height: 13vw;
  text-align: center;  
  background: rgba(53,162,255,1);
  color:rgba(255,255,255,1);
  border-radius:  6.5vw ; 
  font-size:4.27vw;
  
  margin-bottom: 5vw;
`

const InviteButton = styled(Link)`
  display: block;
  text-decoration: none;
  width: 75vw;
  height: 13vw;
  line-height: 13vw;
  text-align: center;  
  background: rgba(28,191,97,1);
  color:rgba(255,255,255,1);
  border-radius:  6.5vw;
  font-size:4.27vw;
`

class Game extends Component {
  state = {
    online_num: 0,
    statics: {
      play_num: 0,
      win_num: 0,
      win_point: 0,
    }
  }

  async componentDidMount() {
    const { gameId, profile } = this.props;

    const[game, statics] = await Promise.all([
      client.call('enter_game', {uid: profile.uid, game_id: gameId}),
      request('/v1/user_game_result', {uid: profile.uid, game_id: gameId}),
    ])

    if (game.success) {
      this.setState({
        online_num: game.result.online_num
      })
    }

    if (statics.success) {
      this.setState({
        statics: statics.payload
      })
    }
  }

  render() {
    const { gameId, profile } = this.props;
    const { statics } = this.state;

    return <Wrapper>
      <Header>
        <Icon/>
        <Title>跳一跳</Title>
        <Description>{this.state.online_num}人在玩</Description>
        <RuleLink to={`/game/${gameId}/rule`}>玩法规则 &gt;</RuleLink>
      </Header>
      <Profile>
        <Surround/>
        <Avatar image={profile.avatar}/>
        <Username>{profile.nick_name}</Username>
        <Record>
          <span>总局数: {statics.play_num}</span>
          <span> 胜率: {statics.play_num > 0 ? Math.ceil(statics.win_num / statics.play_num * 100) : 100}%</span>
        </Record>
      </Profile>
      <Ranking to={`/ranking/${gameId}`}>
        <Text>查看排行榜</Text>
        <RankingLink>胜点：{statics.win_point} &gt;</RankingLink>
      </Ranking>
      <Bottom>
        <MatchButton to={{
          pathname: '/matching',
          state: {
            type: 'auto',
            gameId
          }
        }}>开始匹配</MatchButton>
        <InviteButton to={{
          pathname: '/matching',
          state: {
            type: 'create',
            gameId
          }
        }}>找微信QQ好友一起玩</InviteButton>
      </Bottom>
    </Wrapper>;
  }
}


export default class GameRoute extends Component {
  render() {
    const { gameId } = this.props.match.params;
    
    return (
      <AuthContext.Consumer>
      {
        ({profile}) => <Game profile={profile} gameId={gameId}/>
      }
      </AuthContext.Consumer>
    );
  }
}