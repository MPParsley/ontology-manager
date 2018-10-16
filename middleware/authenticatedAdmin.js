import _get from 'lodash/get'
import gql from 'graphql-tag'
import authenticated from './authenticated'

export default async function ({ app, error }) {
  if (authenticated({ app, error }) === false) {
    return
  }

  // client sets this, if it's unset it cannot be false
  if (_get(app, 'store.$auth.user.isAdmin') === false) {
    error({ errorCode: 503, message: 'You are not allowed to see this' })
  } else {
    // if not set we're on the server
    const client = app.apolloProvider.defaultClient
    const query = gql`query GetUserContent {
      currentPerson {
        isAdmin
      }
    }`

    const result = await client.query({ query })
    const isAdmin = _get(result, 'data.currentPerson.isAdmin')
    if (isAdmin !== true) {
      error({ errorCode: 503, message: 'You are not allowed to see this' })
    }
  }
}
