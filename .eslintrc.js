module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    'cypress/globals': true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/strongly-recommended',
    // https://github.com/cypress-io/eslint-plugin-cypress
    'plugin:cypress/recommended',
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue',
    'ava',
    'cypress'
  ],
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.mjs'] }
    }
  },
  // add your custom rules here
  rules: {
    'vue/require-prop-types': 0,
    'vue/html-self-closing': 0,
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/singleline-html-element-content-newline': 0,
    'vue/multiline-html-element-content-newline': 0,
    'vue/html-closing-bracket-newline': ['error', {
      singleline: 'never',
      multiline: 'never'
    }],
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-lonely-if': 'error',
    quotes: ['error', 'single', { 'avoidEscape': true }],
    'callback-return': ['error', ['done', 'callback', 'cb', 'send']],
    'object-shorthand': 'error',
    'no-multi-spaces': ['error', { 'ignoreEOLComments': true }],
    'brace-style': ['error', 'stroustrup', { 'allowSingleLine': false }],
    'curly': ['error', 'all'],
    'template-curly-spacing' : 'off',
    indent : 'off'
  }
}
