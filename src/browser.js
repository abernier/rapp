import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"

import App from "./App.js"

const context = window.__CONTEXT__

ReactDOM.hydrate(
  <BrowserRouter>
    <App {...context} />
  </BrowserRouter>,
  document.getElementById("root")
)
