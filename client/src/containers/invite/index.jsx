import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import client from '../../client';
import { AuthContext } from '../../context';

class Invite extends Component {
    state = {
        enter: false
    }

    async componentDidMount() {
        const { gameId, roomId, profile } = this.props;
        const {success} = await client.call('enter_game', {game_id: gameId, uid: profile.uid});
        if (success) {
            this.setState({
                enter: true
            })
        }
    }

    render() {
        const { gameId, roomId } = this.props;

        return this.state.enter
            ? <Redirect to={{
                pathname: '/matching',
                state: {
                    type: 'join',
                    gameId,
                    room: roomId,
                }
            }} />
            : null;
    }
}


export default class InviteRoute extends Component {
    render() {
        const { gameId, roomId } = this.props.match.params;

        return <AuthContext.Consumer>
        {
            ({profile}) => {
                const props = {
                    gameId,
                    roomId,
                    profile
                }
                return <Invite {...props}/>
            }
        }
        </AuthContext.Consumer>
    }
}