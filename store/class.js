import * as VueDeepSet from 'vue-deepset'

import { Class, generateClassProposal, toDataset } from '@/models/Class'
import { createClassProposal } from '@/libs/proposals'

import { SUBMIT, NEW } from '@/store/action-types'
import { ERROR, SUCCESS } from '@/store/mutation-types'

export const state = () => ({
  clss: new Class(),
  error: false,
  success: false
})

export const getters = {
  error: (state) => state.error,
  success: (state) => state.success,
  dataset: (state) => toDataset(state.clss, false)
}

export const mutations = VueDeepSet.extendMutation({
  [ERROR] (state, error) {
    state.error = error
    state.success = false
  },
  [SUCCESS] (state, id) {
    state.error = false
    state.success = id
  },
  [NEW] (state) {
    throw new Error('not implemented')
  }
})

export const actions = {
  async [SUBMIT] ({ commit, state }, token) {
    try {
      const classProposalData = generateClassProposal({
        ontology: typeof window !== 'undefined' ? window.ontology : {},
        structure: typeof window !== 'undefined' ? window.structure : {},
        clss: state.clss
      })

      const id = await createClassProposal({
        clss: state.clss,
        ontologyContent: classProposalData.ontologyContent,
        structureContent: classProposalData.structureContent,
        token
      })

      commit(SUCCESS, id)
    } catch (error) {
      console.error(error)
      commit(ERROR, error.message)
    }
  },

  [NEW] ({ commit }) {
    commit(NEW)
  }
}
