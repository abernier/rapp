import React, { StrictMode, useEffect } from "react"
import { Helmet } from "react-helmet"
import styled from "styled-components"
import { FormattedMessage } from "react-intl"

import { Switch, Route, NavLink } from "react-router-dom"

import I18n, { useI18n } from "./i18n.js"
import Theme, { useTheme, themes } from "./Theme.js"

import NotFound from "./NotFound"

import routes from "./routes.js"

function LangSwitcher(props) {
  const [{ fetching, locale }, i18nDispatch] = useI18n()

  return (
    <div className="LangSwitcher">
      <p>
        <label>
          <FormattedMessage
            id="common.langswitcher.label"
            defaultMessage="Select your language"
          />
          <select
            defaultValue={locale}
            onChange={e => {
              i18nDispatch({ type: "CHANGE_LOCALE", locale: e.target.value })
            }}
            disabled={fetching}
          >
            {["en", "fr", "it"].map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
      </p>
    </div>
  )
}

function ThemeSwitcher(props) {
  const [{ name }, themeDispatch] = useTheme()

  return (
    <div className="ThemeSwitcher">
      <p>
        <select
          defaultValue={name}
          onChange={e => {
            themeDispatch({ type: "CHANGE_THEME", value: e.target.value })
          }}
        >
          {themes.map(theme => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </p>
    </div>
  )
}

function Layout(props) {
  const [{ fetching }, i18nDispatch] = useI18n()
  const [{ name: themename }] = useTheme()

  const StyledDiv = styled.div`
    min-height: 100vh;
    overflow: hidden;
    padding: 8px;

    &.theme-light {
      background: #fefefe;
      color: #666;
    }
    &.theme-dark {
      background: #607d8b;
      color: #fff;
    }
  `

  return (
    <StyledDiv
      className={`App theme-${themename}`}
      style={{ fontFamily: fetching ? "flow" : "inherit" }}
    >
      <LangSwitcher />
      <ThemeSwitcher />

      {/* nav */}
      <nav>
        {Object.keys(routes).map(pagename => {
          const page = routes[pagename]
          const route = page.route

          return (
            <NavLink key={route.path} to={route.path} exact={route.exact}>
              {pagename}
            </NavLink>
          )
        })}
        <NavLink to="/nowhere">404</NavLink>
      </nav>

      {props.children}
    </StyledDiv>
  )
}

function Page(props) {
  const [, , patch] = useI18n()

  const { pagename, Component, routepath } = props

  // I18n patching datas
  const { data } = Component // data are attached to the page's component
  if (!!data)
    Object.keys(data).forEach(function(componentName) {
      patch(data[componentName], `${pagename}.${componentName}.`)
    })

  return (
    <>
      <Helmet>
        <title>{pagename || ""}</title>
      </Helmet>
      <Component routepath={routepath} />
    </>
  )
}

function App(props) {
  // console.log("REACT_APP_FOO", process.env.REACT_APP_FOO)

  return (
    <>
      <StrictMode>
        <I18n {...props.i18n}>
          <Theme>
            <Switch>
              {/* One <Route> per page */}
              {Object.keys(routes).map(pagename => {
                const { route } = routes[pagename]

                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    exact={route.exact}
                    render={routerProps => {
                      return (
                        <Layout>
                          <Page
                            pagename={pagename}
                            Component={route.component}
                            routepath={route.path}
                          />
                        </Layout>
                      )
                    }}
                  />
                )
              })}

              {/* last route, ie: 404 */}
              <Route
                render={routerProps => {
                  return (
                    <>
                      <Layout>
                        <Helmet>
                          <title>404</title>
                        </Helmet>
                        <NotFound />
                      </Layout>
                    </>
                  )
                }}
              />
            </Switch>
          </Theme>
        </I18n>
      </StrictMode>
    </>
  )
}

export default App
