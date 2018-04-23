import React, { Component } from 'react';
import styled from 'styled-components';

import { Redirect, Link } from 'react-router-dom';

import { Toast } from 'antd-mobile';

import { AuthContext } from '../../context';

import Badge from './badge';
import Player from './player';

import client from '../../client';


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

const BackButton = styled(Link).attrs({to: '/'})`
    display: block;
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

class Ending extends Component {
  
  state = {
    replay: null,
    ready: {
      mine: false,
      opponent: false,
    },
    exit: {
      mine: false,
      opponent: false,
    }
  }

  master = null
  uids = new Map()

  handleReplay = async () => {
    const {profile, params} = this.props;


    this.replayConfirm(profile.uid);

    const promises = params.players
      .filter(player => player.uid != profile.uid)
      .map(player =>
        client.call('user_message', {
          uid: player.uid,
          game_id: params.game_id,
          data: {
            type: 'replay.confirm',
            uid: profile.uid,
            room: params.room,
          }
        })
      )

    await Promise.all(promises);
    
  }

  handleExit = async () => {
    const {profile, params} = this.props;

    this.replayExit(profile.uid);

    const promises = params.players
      .filter(player => player.uid != profile.uid)
      .map(player =>
        client.call('user_message', {
          uid: player.uid,
          game_id: params.game_id,
          data: {
            type: 'replay.exit',
            uid: profile.uid,
            room: params.room,
          }
        })
      )

    await Promise.all(promises);
  }

  handleUserMessage = data => {
    const {profile, params} = this.props;
    switch (data.type) {
      case 'replay.confirm':
        data.room == params.room && this.replayConfirm(data.uid);
        break;
      case 'replay.exit':
        data.room == params.room && this.replayExit(data.uid);
        break;
      case 'replay.invite':
        client.push('join_room', {room: data.room, uid: profile.uid, game_id: params.game_id});
        break;
    }
  }

  handleStart = data => {
    this.setState({
      replay: data
    })
  }

  async replayExit(uid) {
    const {profile, params} = this.props;
    
    if (profile.uid == uid) {
      this.setState({
        exit: {...this.state.exit, mine: true}
      });
    } else {
      this.setState({
        exit: {...this.state.exit, opponent: true}
      });
    }
  }

  async replayConfirm(uid) {
    const {profile, params} = this.props;

    if(profile.uid == this.master.uid ) {
      this.uids.set(uid, true);
    
      if (this.uids.size == params.players.length) {
        const {success, result, message} = await client.call('create_room',{uid: profile.uid, game_id: params.game_id, user_limit: 2});
        const invites = params.players
          .filter(player => player.uid != profile.uid)
          .map(player =>
            client.call('user_message', {
              uid: player.uid,
              game_id: params.game_id,
              data: {
                type: 'replay.invite',
                room: result.room_id,
              }
            })
          )
      }
    }

    if (profile.uid == uid) {
      this.setState({
        ready: {...this.state.ready, mine: true}
      });
    } else {
      this.setState({
        ready: {...this.state.ready, opponent: true}
      });
    }
  }

  componentDidMount() {
    const {profile, params} = this.props;

    this.master = params.players[0];

    client.on('notify.user_message', this.handleUserMessage);
    client.on('notify.start', this.handleStart);
  }

  componentWillUnmount() {
    client.off('notify.user_message', this.handleUserMessage);
    client.off('notify.start', this.handleStart);
  }

  getRepay() {
    const {ready, exit} = this.state;
    if (exit.opponent) {
      return {enabled: false, text: '对方已经离开'};
    } else if (ready.mine && ready.opponent) {
      return {enabled: false, text: '即将开局'};
    } else if (ready.mine) {
      return {enabled: false, text: '等待对方接受'};
    } else if (ready.opponent) {
      return {enabled: true, text: '对方请求再战'};
    } else {
      return {enabled: true, text: '再来一局'};
    }
  }

  render() {
    const {profile, params} = this.props;

    if (params && this.state.replay) {
      return <Redirect to={{
          pathname: `/play/${params.game_id}`,
          state: this.state.replay
        }}/>
    } else if (params) {
      const {enabled, text} = this.getRepay();
      return (
        <Wrapper>
          <TopBadge type={params.result} avatar={profile.avatar}/>
          <Profile>
              <Content>{params.win_point} 胜点</Content>
              <PlayerBox>
                  {
                    params.players.map(player => 
                      <Player
                        avatar={player.avatar}
                        gender={player.gender}
                      />
                    )
                  }
              </PlayerBox>
          </Profile>
          <ReplayButton onClick={enabled ? this.handleReplay : () => {}}>{text}</ReplayButton>
          <BackButton onClick={this.handleExit}>返回首页</BackButton>
        </Wrapper>
      );
    } else {
      return <Redirect to="/"/>
    }
  }
}

export default class EndingRoute extends Component {
  render() {
    const params = this.props.location.state;
    if (params) {
        return <AuthContext.Consumer>
          {
            ({profile}) => <Ending profile={profile} params={params}/>
          }
        </AuthContext.Consumer>;
    } else {
      return <Redirect to="/" />
    }
  }
}