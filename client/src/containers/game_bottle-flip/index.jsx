import React, { Component } from 'react';

import BottleFlip from './game';

import client from  '../../client';
import { AuthContext } from '../../context';

class BottleFlipGame extends Component {
  state = {
    mine: 0,
    opponent: 0,
  }

  wrapper = React.createRef();
  game = new BottleFlip();

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
    
  }

  componentWillUnmount() {
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
      }}>{this.state.mine} - {this.state.opponent}</div>
    </div>;
  }
}


export default class Wrapper extends Component {
  render() {
      const params = this.props.location.state;
      return <AuthContext.Consumer>
        {
            ({profile}) => <BottleFlipGame profile={profile} params={params}/>
        }  
      </AuthContext.Consumer>;
  }
}