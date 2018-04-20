import React, { Component } from 'react';

import styled, { css } from 'styled-components';

import Gender from '../../components/gender/';

const Wrapper = styled.div`
    position: relative;
    width: 13vw;
    height: 13vw;
`;

const Avatar = styled.div`
    width: 13vw;
    height: 13vw;
    border-radius: 6.5vw;
    background: rgba(162,162,162,1);
    background-image: url(${props => props.image});
    background-size: cover;
`;

const AbsoluteGender = styled(Gender)`
    position: absolute;
    right: 0.5vw;
    bottom: 0.5vw;
`;

export default class Player extends Component {
    render() {
        const {gender, avatar, ...rest} = this.props;
        return <Wrapper>
            <Avatar image={avatar}/>
            <AbsoluteGender number={gender}/>
        </Wrapper>;
    }
}