import React from "react"

import styled from "styled-components"

// see: https://www.styled-components.com/docs/basics
const StyledButton = styled.button`
  display: inline-block;
  padding: 0.5em;
  background: papayawhip;
  color: ${props => props.color || "palevioletred"};
  border: 0;
  border-radius: 3px;

  &:hover {
    background: ${props => props.color || "palevioletred"};
    color: papayawhip;
  }
`

function Button(props) {
  return <StyledButton {...props}>{props.children}</StyledButton>
}

export default Button
