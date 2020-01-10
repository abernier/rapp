import React from "react"

import { FormattedMessage } from "react-intl"

const NotFound = () => (
  <>
    <h1>
      <FormattedMessage
        id="common.notfound.h1"
        defaultMessage="Page not found"
      />
    </h1>
  </>
)

export default NotFound
