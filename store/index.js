export const state = () => ({})

export const mutations = {}

export const actions = {
  // Note: this gets called during SSR, which is
  // a. why we have access to `req`
  // b. why it will be broken client-side: data will be (de)serialized to/from JSON for the client
  async nuxtServerInit (store, { req, res }) {
    if (req && req.ontology) {
      store.commit('graph/setOntology', req.ontology)
    }
    if (req && req.structure) {
      store.commit('graph/setStructure', req.structure)
    }
  }
}
