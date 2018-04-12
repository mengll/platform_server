import React, { Component } from 'react';
import styled from 'styled-components';

import Badge from './badge';
import Player from './player';


const Wrapper = styled.div`
  box-sizing: border-box;
  min-height: 100vh;
  background-size: cover;
  padding: 13vw 10vw 13vw 10vw;
  background:rgba(18,25,41,1);
`



const Title = styled.div`

  height: 8vw;
  font-size: 9.07vw;
  color: rgba(48,48,48,1);
  line-height: 3vw;

  text-align: center;
  margin-bottom: 8vw;
`

const Time = styled.div`
  height: 4vw;
  font-size: 4.27vw;
  color: rgba(48,48,48,1);
  line-height: 2.67vw;

  text-align: center;
  margin-bottom: 10vw;
`

const GameName = styled.div`
  box-sizing: border-box;
  margin: 0 auto;

  border: 0.5vw solid #FFFFFF;

  width: 27vw;
  height: 13vw;
  line-height: 12vw;

  color: rgba(255,255,255,1);
  background: rgba(255,129,37,1);
  border-radius: 6.5vw; 
  text-align: center;

  margin-bottom: 13vw;
`

const Profile = styled.div`
  position: relative;
  box-sizing: border-box;

  margin: 0 auto;
  margin-top: -6.5vw;

  padding: 10vw 0;

  width: 80vw;
  height: 63vw;
  background: rgba(255,255,255,1);
  border-radius: 2.5vw;

  margin-bottom: 8vw;
`

const Avatar = styled.div`
  margin: 0 auto;

  width: 21vw;
  height: 21vw;

  border-radius: 10.5vw;

  background-color: #3586FF;
`

const UserName = styled.div`
  
  margin-top: 4vw;

  height: 4vw;

  font-size: 4vw;
  color: rgba(48,48,48,1);
  line-height: 2.67vw;

  text-align: center;
`

const NameText = styled.div`
  display: inline-block;
  vertical-align: middle;
`

const Content = styled.div`
    margin-top: 7vw;
    height: 8vw;
    line-height: 8vw;
    font-size: 8vw;
    font-weight: bold;
    color: rgba(48,48,48,1);
    text-align: center;
`

const TopBadge = styled(Badge)`
    position: relative;
    z-index: 1;
`

const PlayerBox = styled.div`
    padding: 14vw;
    padding-bottom: 0;

    display: flex;
    justify-content: space-between;
`;

const ReplayButton = styled.div`
    margin: 0 auto;
    width: 64vw;
    height: 13vw;
    line-height: 13vw;
    border-radius: 6.5vw ; 
    background: rgba(53,134,255,1);
    color: rgba(255,255,255,1);
    font-size: 4.27vw;
    text-align: center;

    margin-bottom: 5vw;
`

const BackButton = styled.div`
    margin: 0 auto;
    width: 64vw;
    height: 13vw;
    line-height: 13vw;
    border-radius: 6.5vw ; 
    background:rgba(68,75,85,1);
    color: rgba(255,255,255,1);
    font-size: 4.27vw;
    text-align: center;

    margin-bottom: 5vw;
`

export default class Matching extends Component {
  render() {
    return (
      <Wrapper>
        <TopBadge type="success" text="胜　利"/>
        <Profile>
            <Content>15 胜点</Content>
            <PlayerBox>
                <Player gender="male"/>
                <Player gender="female"/>
            </PlayerBox>
        </Profile>
        <ReplayButton>再来一局</ReplayButton>
        <BackButton>换个游戏</BackButton>
      </Wrapper>
    );
  }
}