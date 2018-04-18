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
import BottleFlipGame from './containers/game_bottle-flip/';
import Authorize from './containers/authorize/';
import Invite from './containers/invite/';


import client from './client';


import {  AuthContext } from './context';

class Heartbeat extends Component {
  timer = null;
  
  static INTERVAL = 1000;

  componentDidMount() {
    this.timer = setInterval(() => {
      client.push('game_heart', {uid: this.props.profile.uid});
    }, Heartbeat.INTERVAL)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return null;
  }
}

class App extends Component {

  updateProfile = profile => {
    console.log('updaet', profile);
    this.setState({auth: {profile, update: this.updateProfile}})
  }

  state = {
    auth: {
      accessToken: sessionStorage.getItem('accessToken'),
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
              <AuthRoute exact path="/play" component={BottleFlipGame}/>
              <AuthRoute path="/invite/:roomId" component={Invite}/>
            </React.Fragment>
        </Router>

        <AuthContext.Consumer>
          {
            ({profile}) => {
              return profile && <Heartbeat profile={profile}/>
            }
          }
        </AuthContext.Consumer>
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
                return <Redirect to={{
                  pathname: "/authorize",
                  state: { from: window.location.href }
                }}/>
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
