import _get from 'lodash/get'
import gql from 'graphql-tag'
import authenticated from './authenticated'

export default async function ({ app, error }) {
  if (authenticated({ app, error }) === false) {
    return
  }

  // client sets this, if it's unset it cannot be false
  if (_get(app, 'store.$auth.$storage.getState("isSuperadmin")') === false) {
    error({ statusCode: 403, message: 'You are not allowed to see this' })
    return
  }

  try {
    // if not set we're on the server
    const client = app.apolloProvider.defaultClient
    const query = gql`query GetUserContent {
      currentPerson {
        isSuperadmin
      }
    }`

    const result = await client.query({ query })
    const isSuperadmin = _get(result, 'data.currentPerson.isSuperadmin')
    if (isSuperadmin !== true) {
      error({ statusCode: 403, message: 'You are not allowed to see this' })
    }
  }
  catch (err) {
    if (process.server) {
      console.error(err)
    }
    error({ statusCode: 403, message: 'You are not allowed to see this' })
  }
}
