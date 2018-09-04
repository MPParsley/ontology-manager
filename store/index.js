export const state = () => ({})

export const mutations = {}

export const actions = {
  async nuxtServerInit (context, { req }) {
    if (req) {
      context.commit('graph/setOntology', req.ontology)
      context.commit('graph/setStructure', req.structure)
    }
  }
}
