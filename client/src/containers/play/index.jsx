import React, { Component } from 'react';

import client from  '../../client';

export default class Play extends Component {
    state= {
        score: 0,
        other: 0,
    }

    params = null;

    handleClick = () => {
        const score = this.state.score;
        client.call('room_message',  {room: this.params.room, game_id: "1990", data:{score} })
        this.setState({
            score: score + 1
        })
    }

    componentDidMount() {
        client.on('notify.room_message', (params) => {
            this.setState({
                other: params.data.score
            })
        })
        const params = this.props.location.state;
        this.params = params;
    }

    render() {

        return <div onClick={this.handleClick}>{this.state.score}-{this.state.other}</div>;
    }
}