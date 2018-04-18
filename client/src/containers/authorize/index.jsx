import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import client from '../../client';

import {  AuthContext } from '../../context';

class Authorize extends Component {

    async redirect() {
        const {success, result} = await client.call('authorize', {})
        if (success) {
            window.location.href = result.url;
        }
    }

    async componentDidMount() {
        const accessToken = this.props.auth.accessToken;

    
        if (accessToken) {
            sessionStorage.setItem('accessToken', accessToken);

            const {success, result} = await client.call('login', {access_token: accessToken, game_id: '1907'})
            
            if (success) {
                this.props.auth.update(result);
                const authorizeFrom = sessionStorage.getItem('authorizeFrom') || '/';
                window.location.href = authorizeFrom;
            } else {
                sessionStorage.removeItem('accessToken');
                this.redirect();
            }

        } else {
            this.redirect();
        }
    }

    render() {
        return '登陆中';
    }
}


export default class Wrapper extends Component {
    state= {
        auth: null
    }

    render() {
        console.log(this.props);
        const { accessToken = null} = this.props.match.params;
        const { from = null } = this.props.location.state || {};
        if (from) {
            sessionStorage.setItem('authorizeFrom', from);
        }
        return (
            <AuthContext.Consumer>
            {
                auth => <Authorize auth={{...auth, accessToken: accessToken || auth.accessToken}}/>
            }
            </AuthContext.Consumer>
        );
    }
}