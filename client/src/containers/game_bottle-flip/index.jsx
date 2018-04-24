import React, { Component } from 'react';

import styled from 'styled-components';

import { Redirect } from 'react-router-dom';

import BottleFlip from './game';

import Player from './player';
import ScoreBoard from './score-board';


import client from  '../../client';
import { AuthContext } from '../../context';

import { vw } from '../../utils';


const gameId = 'bottle-flip';


const Mine = styled(Player).attrs({mine: true})`
  position: absolute;
  left: 0;
  top: 0;
`

const Opponent = styled(Player).attrs({mine: false})`
  position: absolute;
  right: 0;
  top: 0;
`;


const UI = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
`

class BottleFlipGame extends Component {

  TIME_LIMIT = 10

  state = {
    mine: 0,
    opponent: 0,
    countdown: this.TIME_LIMIT
  }

  wrapper = React.createRef();
  game = new BottleFlip();

  timer = null;
  start = new Date();

  handleRoomMessage = ({data}) => {
    const { profile } = this.props;

    if (data.uid !== profile.uid) {
      this.setState({
          opponent: data.score
      })
    }
  }

  handleGameScore = (event) => {
    const { profile, params } = this.props;

    const score = event.score;
    client.call('room_message',  {room: params.room, game_id: gameId, data:{score, uid: profile.uid} })
    this.setState({
      mine: score
    })
  }

  handleTick = async() => {
    const { profile, params } = this.props;

    const countdown = this.TIME_LIMIT - Math.ceil((new Date() - this.start) / 1000);
    if (countdown >= 0) {
      this.setState({
        countdown: countdown
      })

      if (countdown == 0) {
        clearInterval(this.timer);
        const data = {
          game_id: gameId,
          uid: profile.uid,
          value: this.state.mine,
          text: this.state.mine.toString(), 
          extra: {},
          room: params.room
        }

        // this.props.onResult({...data, result: 'lose', winning_point: 15});

        const {success, result, message} = await client.call('game_result', data)
        
        if (success) {
          if (this.props.onResult) {
            this.props.onResult({...data, ...result, players: params.info});
          }
        }
      }
    }
  }

  componentDidMount() {
    this.game.start(Math.random() * 10000);
    this.wrapper.current.appendChild(this.game.renderer.domElement);
    this.timer = setInterval(this.handleTick, 1000);
    this.game.addEventListener('score', this.handleGameScore)
    client.on('notify.room_message', this.handleRoomMessage);
    
  }

  componentWillUnmount() {
    this.game.stop();
    clearInterval(this.timer);
    this.game.removeEventListener('score', this.handleGameScore);
    client.off('notify.room_message', this.handleRoomMessage);
    this.wrapper.current.removeChild(this.game.renderer.domElement);
  }

  render() {
    const { profile, params } = this.props;
    const players = params.info,
          opponent = players.filter(p => p.uid != profile.uid)[0]
    return <div>
      <div style={{ width: '100vw', height: '100vh' }} ref={this.wrapper}></div>
      <UI>
        <ScoreBoard mine={this.state.mine} opponent={this.state.opponent} time={this.state.countdown}/>
        <Mine name={profile.nick_name} avatar={profile.avatar}/>
        <Opponent name={opponent.nick_name} avatar={opponent.avatar}/>
      </UI>
    </div>;
  }
}


export default class Wrapper extends Component {

  handleResult = params => {
    this.props.history.push({
      pathname: '/ending',
      state: params
    })
  }

  render() {
      const params = this.props.location.state;
      if (!params) {
        return <Redirect to="/" />;
      }

      return <AuthContext.Consumer>
        {
            ({profile}) => <BottleFlipGame profile={profile} params={params} onResult={this.handleResult}/>
        }  
      </AuthContext.Consumer>;
  }
}