import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import styled from 'styled-components';

import { AuthContext } from '../../context';

import share from '../../components/share/';
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

const RuleLink = styled.a`
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

const Ranking = styled.div`
  position: relative;

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

const RankingLink = styled.a`
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

const InviteButton = styled.div`
  cursor: pointer;
  width: 75vw;
  height: 13vw;
  line-height: 13vw;
  text-align: center;  
  background: rgba(28,191,97,1);
  color:rgba(255,255,255,1);
  border-radius:  6.5vw;
  font-size:4.27vw;
`

export default class Game extends Component {
  render() {
    console.log('game');
    return (
      <AuthContext.Consumer>
      {
        ({profile}) => <Wrapper>
          <Header>
            <Icon/>
            <Title>跳一跳</Title>
            <Description>65238对在玩</Description>
            <RuleLink>玩法规则 &gt;</RuleLink>
          </Header>
          <Profile>
            <Surround/>
            <Avatar image={profile.avatar}/>
            <Username>{profile.username}</Username>
            <Record>总局数: 1 胜率: 100%</Record>
          </Profile>
          <Ranking>
            <Text>查看排行榜</Text>
            <RankingLink>胜点：110 &gt;</RankingLink>
          </Ranking>
          <Bottom>
            <MatchButton to={'/matching'}>开始匹配</MatchButton>
            <InviteButton onClick={async () => {
              const {success, result, message} = await client.call('create_room',{uid: profile.uid, user_limit: 2});
              if (success) {
                share.share({
                  image: window.location.origin + '/bottle-flip.jpg',
                  url: window.location.origin + '/#/invite/' +  result.room_id,
                  title: '这游戏真神，每天晚上不玩一下都睡不着觉！',
                  content: '进来和我一决高下吧，来吧~'
                });
                this.props.history.push({
                  pathname: '/matching',
                  state: {
                    type: 'create',
                    room: result.room_id
                  }
                })
              } else {
                console.log(message);
              }
            }} >找微信QQ好友一起玩</InviteButton>
          </Bottom>
        </Wrapper>
      }
      </AuthContext.Consumer>
    );
  }
}