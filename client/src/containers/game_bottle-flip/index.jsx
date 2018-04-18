import React, { Component } from 'react';

import BottleFlip from './game';

import client from  '../../client';
import { AuthContext } from '../../context';

class BottleFlipGame extends Component {

  TIME_LIMIT = 40

  state = {
    mine: 0,
    opponent: 0,
    countdown: this.TIME_LIMIT
  }

  wrapper = React.createRef();
  game = new BottleFlip();

  timer = null;

  componentDidMount() {
    const { profile, params } = this.props;

    this.game.start();

    this.game.addEventListener('score', (event) => {
      const score = event.score;
      client.call('room_message',  {room: params.room, data:{score, uid: profile.uid} })
      this.setState({
        mine: score
      })
    })


    client.on('notify.room_message', ({data}) => {
      if (data.uid !== profile.uid) {
          this.setState({
              opponent: data.score
          })
      }
    })

    this.wrapper.current.appendChild(this.game.renderer.domElement);

    const start = new Date();
    this.timer = setInterval(async () => {
      const countdown = this.TIME_LIMIT - Math.ceil((new Date() - start) / 1000);
      if (countdown >= 0) {
        this.setState({
          countdown: countdown
        })

        if (countdown == 0) {
          clearInterval(this.timer);
          const data = {
            uid: profile.uid,
            value: this.state.mine,
            text: this.state.mine.toString(), 
            extra: {},
            room: params.room
          }
          const {success, result, message} = await client.call('game_result', data)
          if (success) {
            if (this.props.onResult) {
              this.props.onResult({...data, ...result});
            }
          }
        }
      }

    }, 1000);
    
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.wrapper.current.removeChild(this.game.renderer.domElement);
  }

  render() {
    return <div>
      <div style={{ width: '100vw', height: '100vh' }} ref={this.wrapper}></div>
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '10vh',
        lineHeight: '10vh',
        backgroundColor: 'rgba(0,0,0,0.2)',
        color: '#fff',
        textAlign: 'center',
        fontSize: '4vw',
      }}>{this.state.mine} - [{this.state.countdown}] - {this.state.opponent}</div>
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
      return <AuthContext.Consumer>
        {
            ({profile}) => <BottleFlipGame profile={profile} params={params} onResult={this.handleResult}/>
        }  
      </AuthContext.Consumer>;
  }
}