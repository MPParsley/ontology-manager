import * as VueDeepSet from 'vue-deepset'
import _get from 'lodash/get'
import gql from 'graphql-tag'

import { Property, generatePropertyProposal, toDataset } from '@/models/Property'
import { submitProposal, proposalSerializer } from '@/libs/proposals'

import { SAVE, SUBMIT, NEW } from '@/store/action-types'
import { SET_ID, ERROR, SUCCESS } from '@/store/mutation-types'

export const state = () => ({
  prop: new Property(),
  error: false,
  success: false
})

export const getters = {
  dataset: (state) => toDataset(state.prop, false),
  error: (state) => state.error,
  success: (state) => state.success
}

export const mutations = VueDeepSet.extendMutation({
  [ERROR] (state, error) {
    state.error = error
    state.success = false
  },
  [SUCCESS] (state, externalId) {
    state.error = false
    state.success = externalId
  },
  [SET_ID] (state, threadId) {
    state.prop.threadId = threadId
  },
  [NEW] (state) {
    state.prop = new Property()
  }
})

export const actions = {
  async [SAVE] ({ commit, state }, token) {
    try {
      const threadId = state.prop.threadId
      const mutationParam = threadId ? '$id: Int!, ' : ''
      const threadInput = threadId ? 'id: $id,' : ''

      const mutation = gql`
        mutation (${mutationParam}$headline: String!, $body: String!, $iri: String!, $proposalObject: JSON!, $threadType: ThreadType!, $status: Status!) {
          upsertThread (input: {
            thread: {
              ${threadInput}
              headline: $headline,
              body: $body,
              iri: $iri,
              proposalObject: $proposalObject,
              threadType: $threadType,
              status: $status
            }
          }) {
            thread {
              id
            }
          }
        }
      `

      const variables = {
        iri: state.prop.parentStructureIRI,
        body: state.prop.motivation,
        proposalObject: JSON.parse(proposalSerializer(state.prop)),
        headline: `New property '${state.prop.label}' on '${state.prop.parentStructureIRI}'`,
        threadType: 'PROPOSAL',
        status: 'DRAFT'
      }

      if (threadId) {
        variables['id'] = threadId
      }
      const result = await this.app.apolloProvider.defaultClient.mutate({
        mutation,
        variables
      })

      const threadIdFromResult = _get(result, 'data.upsertThread.thread.id')

      commit(SET_ID, threadIdFromResult)
    } catch (error) {
      console.error(error)
      commit(ERROR, error.message)
    }
  },

  async [SUBMIT] ({ commit, state }, token) {
    try {
      const propertyProposalData = generatePropertyProposal({
        ontology: typeof window !== 'undefined' ? window.ontology : {},
        structure: typeof window !== 'undefined' ? window.structure : {},
        property: state.prop
      })

      const id = await submitProposal({
        object: state.prop,
        title: `New property '${state.prop.label}' on '${state.prop.parentStructureIRI}'`,
        message: `add property '${state.prop.label}' to '${state.prop.parentStructureIRI}'`,
        ontologyContent: propertyProposalData.ontologyContent,
        structureContent: propertyProposalData.structureContent,
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
