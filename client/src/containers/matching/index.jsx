import React, { Component } from 'react';
import styled from 'styled-components';

import client from '../../client';

import { Redirect } from 'react-router-dom';

import { AuthContext } from '../../context';

const Gender = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: 3vw;
  height: 3vw;
  background-image: ${ ({type}) => `url(${ require(`./gender_${type}.png`) })` };
  background-size: cover;
`;

const Wrapper = styled.div`
  box-sizing: border-box;
  min-height: 100vh;
  background-image: url(${ require('./bg.png') });
  background-size: cover;
  padding: 17vw 10vw 15vw 10vw;
`

const Title = styled.div`

  height: 8vw;
  font-size: 9.07vw;
  color: rgba(48,48,48,1);
  line-height: 3vw;

  text-align: center;
  margin-bottom: 8vw;
`

const Time = styled.div`
  height: 4vw;
  font-size: 4.27vw;
  color: rgba(48,48,48,1);
  line-height: 2.67vw;

  text-align: center;
  margin-bottom: 10vw;
`

const GameName = styled.div`
  box-sizing: border-box;
  margin: 0 auto;

  border: 0.5vw solid #FFFFFF;

  width: 27vw;
  height: 13vw;
  line-height: 12vw;

  color: rgba(255,255,255,1);
  background: rgba(255,129,37,1);
  border-radius: 6.5vw; 
  text-align: center;

  margin-bottom: 13vw;
`

const Profile = styled.div`
  position: relative;
  box-sizing: border-box;

  margin: 0 auto;
  padding: 10vw 0;

  width: 80vw;
  height: 50vw;
  background: rgba(255,255,255,0.5);
  border-radius: 2.5vw;

  margin-bottom: 23vw;
`

const Surround = styled.div`
  position: absolute;
  left: 8vw;
  top: 8vw;

  width: 84vw;
  height: 39vw;
  background-image: url(${require('./bg.png')});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
`

const Avatar = styled.div`
  margin: 0 auto;

  width: 21vw;
  height: 21vw;

  border-radius: 10.5vw;

  background-color: #3586FF;
`

const UserName = styled.div`
  
  margin-top: 4vw;

  height: 4vw;

  font-size: 4vw;
  color: rgba(48,48,48,1);
  line-height: 2.67vw;

  text-align: center;
`

const NameText = styled.div`
  display: inline-block;
  vertical-align: middle;
`

const Record = styled.div`
  position: absolute;
  top: 51vw;

  width: 100vw;
  height: 3.6vw;

  font-size: 3.73vw;
  color: rgba(153,153,153,1);

  line-height: 2.67vw;

  text-align: center;
`

const Ranking = styled.div`
  position: relative;

  box-sizing: border-box;

  width: 100vw;
  height: 12vw;

  padding: 4vw 3vw;

  background: #FFFFFF;
`

const Text = styled.div`
  height: 4vw;
  font-size: 3.73vw;
  color: rgba(48,48,48,1);
  line-height: 4vw;
`

const RankingLink = styled.a`
  position: absolute;
  right: 3vw;
  top: 4vw;

  height: 4vw;
  font-size: 3.73vw;
  color: rgba(153,153,153,1);
  line-height: 4vw;

`

const Close = styled.div`
  margin: 0 auto;
  width: 17vw;
  height: 17vw;
  background-image: url(${ require('./close.png') });
  background-size: cover;
`


class Runner extends Component {

  componentDidMount() {
    const {children: runner, ...rest} = this.props;
    // console.log(this.props);
    if (runner) {
      runner(rest);
    }
  }

  render() {
    return null;
  }
}

class WatingTime extends Component {
  timer = null;
  
  state = {
    seconds: 0
  }

  componentDidMount() {
    const start = new Date();
    this.timer = setInterval(() => {
      this.setState({
        seconds: Math.floor((new Date() - start) / 1000 )
      })
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return <Time>已等待{this.state.seconds}s</Time>;
  }
}

class DefaultMatching extends Component {

  componentDidMount() {
    const { profile } = this.props;
    client.push('search_match', {user_limit: 2, uid: profile.uid})
  }

  cancel = async () =>  {
    const { profile } = this.props;
    await client.call('join_cancel', {uid: profile.uid})
    if(this.props.onCancel) {
      this.props.onCancel();
    }
  }

  render() {
    const { profile } = this.props;

    return <Wrapper>
      <Title>正在匹配</Title>
      <WatingTime/>
      <GameName>跳一跳</GameName>
      <Profile>
        <Avatar/>
        <UserName><NameText>{profile.username}</NameText> <Gender type="male"/></UserName>
      </Profile>
      <Close onClick={this.cancel} />
    </Wrapper>;
  }
}

class CreateMatching extends Component {

  cancel = async () => {
    const { profile, room } = this.props;
    await client.call('out_room', {uid: profile.uid, room: room});
    if(this.props.onCancel) {
      this.props.onCancel();
    }
  }

  render() {
    const { profile } = this.props;

    return <Wrapper>
      <Title>正在匹配</Title>
      <WatingTime/>
      <GameName>跳一跳</GameName>
      <Profile>
        <Avatar/>
        <UserName><NameText>{profile.username}</NameText> <Gender type="male"/></UserName>
      </Profile>
      <Close onClick={this.cancel} />
    </Wrapper>;
  }
}

class JoinMatching extends Component {

  cancel = async () => {
    const { profile, room } = this.props;
    await client.call('out_room', {uid: profile.uid, room: room});
    if(this.props.onCancel) {
      this.props.onCancel();
    }
  }

  componentDidMount() {
    const { profile, room } = this.props;
    client.push('join_room', {room: room, uid: profile.uid});
  }


  render() {
    const { profile } = this.props;
    
    return <Wrapper>
      <Title>正在匹配</Title>
      <WatingTime/>
      <GameName>跳一跳</GameName>
      <Profile>
        <Avatar/>
        <UserName><NameText>{profile.username}</NameText> <Gender type="male"/></UserName>
      </Profile>
      <Close onClick={this.cancel}/>
    </Wrapper>;
  }
}


export default class Matching extends Component {
  state = {
    matching: true,
    params: null,
  }

  handleCancel = () => {
    this.props.history.push('/');
  }

  componentDidMount() {
    client.once('notify.start', (params) => {
      this.setState({
        matching: false,
        params
      })
    })
  }

  render() {
    
    //1. 自动匹配
    //2. 创建房间
    //3. 加入房间

    const { type, room } = this.props.location.state || {};

    if (this.state.matching) {
      return (
        <AuthContext.Consumer>
        {
          ({profile}) => {
            const props = {
              profile,
              room,
              onCancel: this.handleCancel
            }
            if (type === 'create') {
              return <CreateMatching {...props}/>
            } else if (type === 'join') {
              return <JoinMatching {...props}/>
            } else {
              return <DefaultMatching {...props}/>
            }
          }
        }
        </AuthContext.Consumer>
      );
    } else {
      return <Redirect to={{ pathname: '/play', state: this.state.params }}/>
    }

  }
}