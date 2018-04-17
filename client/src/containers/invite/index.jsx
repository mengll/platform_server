import React, { Component } from 'react';

import client from '../../client';
import { AuthContext } from '../../context';

export default class Invite extends Component {
    render() {
        const { roomId } = this.props.match.params;

        return <AuthContext.Consumer>
            {
                ({profile}) => {
                    client.call('join_room', {room: roomId, uid: profile.uid});
                    return null
                }
            }
        </AuthContext.Consumer>
    }
}