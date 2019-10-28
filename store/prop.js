import * as VueDeepSet from 'vue-deepset'
import _get from 'lodash/get'
import gql from 'graphql-tag'

import proposalById from '@/apollo/queries/proposalById'

import { Property, generatePropertyProposal, proposalDataset } from '@/models/Property'
import { submitProposal, proposalSerializer, proposalDeserializer } from '@/libs/proposals'

import { SAVE, SUBMIT, NEW, LOAD } from '@/store/action-types'
import { SET_ID, ERROR, SUCCESS } from '@/store/mutation-types'

export const state = () => ({
  prop: new Property(),
  error: false,
  success: false
})

export const getters = {
  dataset: (state) => proposalDataset(state.prop, false),
  error: (state) => state.error,
  success: (state) => state.success,
  serialized: (state) => proposalSerializer(state.prop)
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
    state.error = false
    state.success = false
  },
  [LOAD] (state, prop) {
    state.prop = prop
  }
})

export const actions = {
  async [LOAD] ({ commit, state }, id) {
    try {
      const result = await this.app.apolloProvider.defaultClient.query({
        query: proposalById,
        variables: {
          id
        }
      })

      const proposal = result.data.proposal
      const deserialized = proposalDeserializer(proposal.proposalObject)

      commit(LOAD, deserialized)
      commit(SET_ID, proposal.id)
      return Promise.resolve(proposal.isDraft)
    }
    catch (error) {
      console.error(error)
      return Promise.reject(error)
    }
  },
  async [SAVE] ({ commit, state }) {
    try {
      const threadId = state.prop.threadId
      const mutationParam = threadId ? '$id: Int!, ' : ''
      const threadInput = threadId ? 'id: $id,' : ''

      const mutation = gql`
        mutation (${mutationParam}$headline: String!, $body: String!, $iri: String!, $proposalObject: JSON!, $threadType: ThreadType!) {
          upsertThread (input: {
            thread: {
              ${threadInput}
              headline: $headline,
              body: $body,
              iri: $iri,
              proposalObject: $proposalObject,
              threadType: $threadType
            }
          }) {
            thread {
              id
            }
          }
        }
      `
      const isEdit = state.prop.isEdit

      const variables = {
        iri: state.prop.parentStructureIRI,
        body: state.prop.motivation,
        proposalObject: JSON.parse(proposalSerializer(state.prop)),
        headline: `${isEdit ? 'Change' : 'New'} property '${state.prop.label}' on '${state.prop.parentStructureIRI}'`,
        threadType: 'PROPOSAL'
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
      return Promise.resolve()
    }
    catch (error) {
      console.error(error)
      commit(ERROR, error.message)
      return Promise.reject(error)
    }
  },

  async [SUBMIT] ({ dispatch, commit, state, rootState }, token) {
    try {
      const propertyProposalData = generatePropertyProposal({
        ontology: rootState.graph.ontology,
        structure: rootState.graph.structure,
        property: state.prop
      })
      const isEdit = state.prop.isEdit

      const id = await submitProposal({
        threadId: state.prop.threadId,
        object: state.prop,
        title: `${isEdit ? 'Change' : 'New'} property '${state.prop.label}' on '${state.prop.parentStructureIRI}'`,
        message: `${isEdit ? 'update' : 'add'} property '${state.prop.label}' to '${state.prop.parentStructureIRI}'`,
        ontologyContent: propertyProposalData.ontologyContent,
        structureContent: propertyProposalData.structureContent,
        token
      })

      commit(SUCCESS, id)
    }
    catch (error) {
      console.error(error)
      commit(ERROR, error.message)
    }
  },

  [NEW] ({ commit }) {
    commit(NEW)
  }
}
