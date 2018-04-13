import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { 
  HashRouter as Router,
  Route,
  Redirect,
} from 'react-router-dom';

import Game from './containers/game/';
import Matching from './containers/matching/';
import Ending from './containers/ending/';
import Play from './containers/play/';
import Authorize from './containers/authorize/';

import client from './client';


import {  AuthContext } from './context';

class App extends Component {

  updateProfile = profile => {
    console.log('updaet', profile);
    this.setState({auth: {profile, update: this.updateProfile}})
  }

  state = {
    auth: {
      profile: null,
      update: this.updateProfile
    }
  }

  render() {
    return (
      <AuthContext.Provider value={this.state.auth}>
      <Router>
          <React.Fragment>
            <Route path="/authorize/:accessToken?" component={Authorize}/>
            <AuthRoute exact path="/" component={Game}/>
            <AuthRoute exact path="/matching" component={Matching}/>
            <AuthRoute exact path="/ending" component={Ending}/>
            <AuthRoute exact path="/play" component={Play}/>
          </React.Fragment>
      </Router>
      </AuthContext.Provider>
    );
  }
}

class AuthRoute extends Component {
  render() {
    const { component, ...rest } = this.props;

    return (
      <Route {...rest} render={props => {
        return <AuthContext.Consumer>
          {
            (auth) => {
              console.log(auth);
              if (auth.profile === null) {
                return <Redirect to="/authorize"/>
              } else {
                return React.createElement(component, props)
              }
            }
          }
        </AuthContext.Consumer>;
      }}/>

    )
  }
}

export default App;
