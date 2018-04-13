import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import client from '../../client';

import {  AuthContext } from '../../context';

class Authorize extends Component {

    async componentDidMount() {
        console.log('authorize mount', this.props);
        const accessToken = this.props.accessToken;

        if (accessToken) {
            const {success, result} = await client.call('login', {access_token: accessToken, game_id: '1907'})
            
            if (success) {
                this.props.auth.update(result);
            }

        } else {
            const {success, result} = await client.call('authorize', {})
            if (success) {
                window.location.href = result.url;
            }
        }
    }

    render() {
        return this.props.auth.profile ? <Redirect to="/" /> : '登陆中';
    }
}


export default class Wrapper extends Component {
    state= {
        auth: null
    }

    render() {
        console.log(this.props);
        const { accessToken = null} = this.props.match.params;
        return (
            <AuthContext.Consumer>
            {
                auth => <Authorize auth={auth} accessToken={accessToken}/>
            }
            </AuthContext.Consumer>
        );
    }
}