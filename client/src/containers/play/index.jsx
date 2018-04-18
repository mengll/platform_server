import React, { Component } from 'react';

import client from  '../../client';
import { AuthContext } from '../../context';

class Play extends Component {
    state= {
        score: 0,
        other: 0,
    }

    params = null;

    handleClick = () => {
        const { profile } = this.props;
        const score = this.state.score + 1;
        this.setState({
            score: score
        })
        client.call('room_message',  {room: this.params.room, data:{score, uid: profile.uid} })
    }

    componentDidMount() {
        const { profile, params } = this.props;
        this.params = params;

        client.on('notify.room_message', ({data}) => {
            if (data.uid !== profile.uid) {
                this.setState({
                    other: data.score
                })
            }
        })

        setTimeout(() => {
            client.call('game_result')            
        }, 10000);
        
        
    }

    render() {
        return <div onClick={this.handleClick}>{this.state.score} - {this.state.other}</div>;
    }
}


export default class Wrapper extends Component {
    render() {
        const params = this.props.location.state;
        return <AuthContext.Consumer>
          {
              ({profile}) => <Play profile={profile} params={params}/>
          }  
        </AuthContext.Consumer>;
    }
}