# ontology-editor

> Semantic Web, RDF ontology editor

## Dev Setup

```bash
# start the DB, give it 2 minutes on the first run for the DB to get created and initialized
$ make dbup

# start all services
$ make up
```

### [Graph*i*QL](http://localhost:5000/graphiql)

Sample queries to try:

```gql
mutation {
  registerPerson (input: {
    firstName: "James",
    lastName: "Bond",
    email: "test@example.com",
    password: "qwer1234"
  }) {
    clientMutationId
  }
}
```

```gql
mutation {
  authenticate (input: {
    email: "test@example.com",
    password: "qwer1234"
  }) {
    jwtToken
  }
}
```

## Build Setup

```bash
# install dependencies
$ npm install # Or yarn install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, checkout the [Nuxt.js docs](https://github.com/nuxt/nuxt.js).
