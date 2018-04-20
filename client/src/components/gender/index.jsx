
import React, { Component } from 'react';
import styled from 'styled-components';

const Image = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: 3vw;
  height: 3vw;
  background-image: ${ ({type}) => `url(${ require(`./gender_${type}.png`) })` };
  background-size: cover;
`;

const genders = {
    "1": "male",
    "2": "female",
};
export const genderString = x => genders[x.toString()];

export default class Gender extends Component {
    render() {
        const { type, number } = this.props;
        const gender = type || number && genderString(number);
        return type ? <Image type={gender}/> : null
    }
} 