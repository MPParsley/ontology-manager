export const state = () => ({})

export const mutations = {}

export const actions = {
  async nuxtServerInit (context, { req }) {
    context.commit('graph/setBase', req.dataset)
  }
}
