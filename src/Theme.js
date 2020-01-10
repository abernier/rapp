import React from "react"

const ThemeContext = React.createContext()

const themes = ["dark", "light"]

const initialState = {
  name: "light"
}

function reducer(state, action) {
  switch (action.type) {
    case "CHANGE_THEME":
      if (themes.indexOf(action.value) === -1) {
        throw new Error(`This theme '${action.value}' does not exist`)
      }
      return {
        ...state,
        name: action.value
      }
    case "RESET_THEME":
      return {
        ...initialState
      }
    default:
      throw new Error(`This action: ${action.type} is not supported`)
  }
}

// A new component that wraps children and allow them to consume the same reducer (complex state)
function ThemeContextProvider(props) {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const value = [state, dispatch]
  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  )
}

// Defining a `useTheme` hook that will consume the provided context
function useTheme() {
  return React.useContext(ThemeContext) // will return `value` to any component that `useTheme()`
}

export default ThemeContextProvider
export { useTheme, themes }
