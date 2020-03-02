import Homepage from "./pages/Homepage"
import About from "./pages/About"

export default {
  homepage: {
    route: {
      path: "/",
      exact: true,
      component: Homepage
    }
  },
  about: {
    route: {
      path: "/about",
      exact: true,
      component: About
    }
  }
}
