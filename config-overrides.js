module.exports = function override(config, env) {
  console.log("config-overrides.js")

  config.module.rules.push({
    test: /\.js$/,
    use: {
      loader: require.resolve("babel-loader")
      // options: {} // <- see `babel.config.js`
    }
  })
  return config
}
