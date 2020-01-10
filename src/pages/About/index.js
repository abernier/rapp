import React from "react"
import {FormattedMessage, FormattedHTMLMessage} from 'react-intl';

import data from "./data.json"

function About(props) {
  console.log('[About]: 👨🏻‍🎨 render');

  return (
    <>
      <h1>
        <FormattedHTMLMessage id="about.h1" defaultMessage="About us" />
      </h1>
      
      <p>Donec laoreet, mi vel cursus porttitor, libero arcu tincidunt lacus, vel posuere nunc nibh vel eros. Vivamus mattis viverra hendrerit. Etiam interdum nec libero sit amet ullamcorper. Quisque nisi turpis, sagittis ac dui id, gravida venenatis augue.</p>
    </>
  );
}

// Expose data
About.data = data

export default About
