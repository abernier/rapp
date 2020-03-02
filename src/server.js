import express from "express"
import cors from "cors"
import React from "react"

import { renderToString } from "react-dom/server"
import { ServerStyleSheet, StyleSheetManager } from "styled-components"

import { StaticRouter, matchPath } from "react-router-dom"
import serialize from "serialize-javascript"

import App from "./App.js"
import routes from "./routes.js"

const app = express()

app.use(cors())
app.use(express.static("public"))

app.get("*", (req, res, next) => {
  const lang = req.acceptsLanguages("en", "fr", "it") || "en"

  const messagesPromise = import(`../public/locales/${lang}.json`).then(
    module => module.default
  )

  const activeRoute =
    Object.values(routes).find(route => matchPath(req.url, route)) || {}
  const fetchInitialDataPromise = activeRoute.fetchInitialData
    ? activeRoute.fetchInitialData(req.path)
    : Promise.resolve()

  Promise.all([messagesPromise, fetchInitialDataPromise])
    .then(([messages, data]) => {
      const context = {
        i18n: {
          lang,
          messages
        },
        data
      }

      // https://styled-components.com/docs/advanced#server-side-rendering
      const sheet = new ServerStyleSheet()

      const markup = renderToString(
        <StaticRouter location={req.url} context={context}>
          <StyleSheetManager sheet={sheet.instance}>
            <App {...context} />
          </StyleSheetManager>
        </StaticRouter>
      )

      res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title></title>

          <!-- https://danross.co/flow/ -->
          <link rel="preload" href="/fonts/flow/flow.woff" as="font" crossorigin>
          <link rel="preload" href="/fonts/flow/flow.woff2" as="font" crossorigin>
          <style>
          @font-face {
            font-family:"flow";
            src:url("/fonts/flow/flow.woff2") format("woff2"),url("/fonts/flow/flow.woff") format("woff");
            font-style:normal;font-weight:400;
          }
          </style>

          <link rel="stylesheet" href="/index.css">
          ${sheet.getStyleTags()}

          <script src="/bundle.js" defer></script>
          <script>window.__CONTEXT__ = ${serialize(context)}</script>
        </head>

        <body>
          <div id="root">${markup}</div>
        </body>
      </html>
    `)
    })
    .catch(next)
})

app.listen(3000, () => {
  console.log(`Server is listening on port: 3000`)
})

/*
  1) Just get shared App rendering to string on server then taking over on client.
  2) Pass data to <App /> on server. Show diff. Add data to window then pick it up on the client too.
  3) Instead of static data move to dynamic data (github gists)
  4) add in routing.
*/
