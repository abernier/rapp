// see: https://babeljs.io/docs/en/next/configuration.html#babelconfigjs
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["@babel/preset-env", "@babel/preset-react"],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-transform-object-assign",
      "@babel/plugin-proposal-object-rest-spread",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-syntax-dynamic-import",
      "babel-plugin-styled-components"
    ]
  };
}
