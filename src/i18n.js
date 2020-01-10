import React from "react"
import { createIntl, createIntlCache, RawIntlProvider } from "react-intl"

import get from "lodash.get"
import set from "lodash.set"

const I18nContext = React.createContext()

function reducer(state, action) {
  switch (action.type) {
    case "CHANGE_LOCALE":
      return {
        ...state,
        locale: action.locale,
        messages: {}
      }
    case "ADD_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          ...action.messages
        }
      }
    case "FETCH_START":
      return { ...state, fetching: true }
    case "FETCH_DONE":
      return { ...state, fetching: false }
    default:
      throw new Error(`This action: ${action.type} is not supported`)
  }
}

// A component that wraps children and allow them to consume the same reducer (complex state)
function I18nContextProvider(props) {
  const [state, dispatch] = React.useReducer(reducer, {
    locale: props.lang || "en",
    messages: {},
    fetching: false
  })

  const { locale } = state

  // https://github.com/formatjs/react-intl/blob/master/docs/API.md#createintl
  const intl = createIntl(
    {
      locale: state.locale,
      messages: state.messages
    },
    createIntlCache()
  )

  //
  // Effect that fetch new dictionnary messages as soon as one of state.locale changes
  //
  React.useEffect(() => {
    let didCancel = false // prevent setting state if unmounted (see: https://www.robinwieruch.de/react-hooks-fetch-data#abort-data-fetching-in-effect-hook)

    console.log("[I18n] useEffect: `state.locale` has changed value")

    if (!locale) {
      console.warn("`locale` is not a thing", locale)
      return // do not fetch
    }

    const url = `/locales/${locale}.json`
    console.log(`[I18n] fetching all messages from '${url}'...`)

    dispatch({ type: "FETCH_START" })
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log("[I18n] fetched!", data)

        if (!didCancel) {
          dispatch({ type: "ADD_MESSAGES", messages: data })
          dispatch({ type: "FETCH_DONE" })
        }
      })
      .catch(er => {
        if (!didCancel) {
          dispatch({ type: "FETCH_DONE" })
          throw er
        }
      })

    return () => {
      didCancel = true
    }
  }, [locale])

  /*
  Will patch an object if a matching key is found into `messages`.

  For example, if:
    - object is `{myarr: [{}, {foo: "Hello"}]}`
    - and there is a `"myarr[1].foo": "Ciao"` entry in messages
    
  => It will be patched to `{myarr: [{}, {foo: "Ciao"}]}`

  We also accept a `prefix` param, to ignore a such prefix when looking into messages.
  For example: `patch({a: "A"}, "foo.bar.")` will patch object if found a `foo.bar.a` key into messages (ignoring `foo.bar.`).
  */
  function patch(obj, prefix = "") {
    let messagesKeys = Object.keys(state.messages)

    // Filter with messages key that start with the same prefix key
    if (prefix.length > 0) {
      messagesKeys = messagesKeys.filter(el => el.startsWith(prefix))
    }

    messagesKeys.forEach(function(messageKey) {
      const objKey = messageKey.split(prefix)[1] // only the right part of the prefix
      const defaultValue = get(obj, objKey) // find that key into `obj` (see: https://lodash.com/docs/4.17.15#get)

      // If key found:
      if (defaultValue) {
        // let's patch the value with `intl.formatMessage` (see: https://lodash.com/docs/4.17.15#set)
        set(
          obj,
          objKey,
          intl.formatMessage({
            id: messageKey,
            defaultMessage: defaultValue
          })
        )
      }
    })
  }

  const value = [state, dispatch, patch]
  return (
    <I18nContext.Provider value={value}>
      <RawIntlProvider value={intl}>{props.children}</RawIntlProvider>
    </I18nContext.Provider>
  )
}

// Defining a `useI18n` hook that consumes the provided context
function useI18n() {
  return React.useContext(I18nContext) // will return `value` to any component that `useI18n()`
}

export default I18nContextProvider
export { useI18n }
