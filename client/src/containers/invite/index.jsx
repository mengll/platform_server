import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import client from '../../client';
import { AuthContext } from '../../context';

export default class Invite extends Component {
    render() {
        const { gameId, roomId } = this.props.match.params;
        return <Redirect to={{
            pathname: '/matching',
            state: {
                type: 'join',
                gameId,
                room: roomId,
            }
        }} />
    }
}