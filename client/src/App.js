import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { 
  HashRouter as Router,
  Route
} from 'react-router-dom';

import Game from './containers/game/';
import Matching from './containers/matching/';
import Ending from './containers/ending/';

class App extends Component {
  render() {
    return (
      <Router>
        <React.Fragment>
          <Route exact path="/" component={Game}/>
          <Route exact path="/matching" component={Matching}/>
          <Route exact path="/ending" component={Ending}/>
        </React.Fragment>
      </Router> 
    );
  }
}

export default App;
