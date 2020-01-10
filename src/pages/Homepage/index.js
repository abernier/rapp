import React from "react"
import {FormattedMessage, FormattedHTMLMessage} from 'react-intl';

import Btn from '../../components/Btn.js'

import data from "./data.json"

const {
  a64_TextBlock,
  c25_Banner,
  j92_EditorialGrid,
  j94_EditorialGrid,
  f54_Banner,
  g34_TextBlock,
  h54_WatchGrid
} = data

function Homepage(props) {
  console.log('[Homepage]: 👨🏻‍🎨 render');

  const winks = props.winks || ['👋', '🏠', '😘'];

  //const [{locale}, dispatch] = useI18n();

  return (
    <>
      <h1>
        <FormattedHTMLMessage id="homepage.h1"
          defaultMessage="Home sweet home {wink}"
          values={{ wink: winks[~~(Math.random()*winks.length)] }}
        />
      </h1>
      
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec laoreet, mi vel cursus porttitor, libero arcu tincidunt lacus, vel posuere nunc nibh vel eros. Vivamus mattis viverra hendrerit. Etiam interdum nec libero sit amet ullamcorper. Quisque nisi turpis, sagittis ac dui id, gravida venenatis augue.</p>

      <Btn color="rebeccapurple">
        <FormattedMessage id="homepage.cta"
          defaultMessage="Click me"
        />
      </Btn>
    </>
  );
}

// Expose data
Homepage.data = data

export default Homepage
