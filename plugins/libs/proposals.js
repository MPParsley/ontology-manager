import axios from 'axios'
import rdf from 'rdf-ext'
import _get from 'lodash/get'
import { parse, stringify } from 'flatted/cjs'

const termsKeys = ['subject', 'predicate', 'object', 'datatype', 'graph']
const termsTypes = {
  DefaultGraph: rdf.defaultGraph,
  NamedNode: rdf.namedNode,
  Literal: rdf.literal
}
export default ({ app }, inject) => {
  inject('submitProposal', submitProposal)
  inject('approveProposal', approveProposal)
  inject('proposalSerializer', proposalSerializer)
  inject('proposalDeserializer', proposalDeserializer)
  inject('proposalType', proposalType)

  const ObjectTypes = { Class: app.$Class, Property: app.$Property }

  async function submitProposal (data) {
    if (!data.threadId) {
      throw new Error('missing data.threadId')
    }
    if (!data.object) {
      throw new Error('missing data.object')
    }
    if (!data.message) {
      throw new Error('missing data.message')
    }
    if (!data.token) {
      throw new Error('missing data.token')
    }

    const token = data.token

    const body = {
      threadId: data.threadId,
      message: data.message,
      iri: data.object.parentStructureIRI
    }

    const headers = { headers: { authorization: `Bearer ${token}` } }

    const result = await axios.post('/api/proposal/submit', body, headers)
    const id = _get(result, 'data.finalizeProposal.thread.id')
    return id
  }

  async function approveProposal ({
    threadId,
    object,
    message,
    ontologyContent,
    structureContent,
    token
  } = {}) {
    if (!threadId) {
      throw new Error('missing threadId')
    }
    if (!object) {
      throw new Error('missing object')
    }
    if (!message) {
      throw new Error('missing message')
    }
    if (!token) {
      throw new Error('missing token')
    }
    if (!ontologyContent) {
      throw new Error('missing ontologyContent')
    }
    if (!structureContent) {
      throw new Error('missing structureContent')
    }

    const body = {
      threadId,
      message,
      ontologyContent,
      structureContent,
      iri: object.parentStructureIRI
    }

    const headers = { headers: { authorization: `Bearer ${token}` } }

    const result = await axios.post('/api/proposal/approve', body, headers)
    const id = _get(result, 'data.finalizeProposal.thread.id')
    return id
  }

  // proposal serializing and deserializing
  function proposalReviver () {
    const seen = new Map()

    const replaceObject = (value) => {
      if (seen.has(value)) {
        const obj = seen.get(value)
        return obj
      }
      const obj = new ObjectTypes[value.proposalType](value)
      seen.set(value, obj)
      return obj
    }

    return (key, value) => {
      if (Array.isArray(value)) {
        return value.map((val) => {
          if (val && typeof val === 'object' && val.proposalType) {
            return replaceObject(val)
          }
          return val
        })
      }

      if (value && typeof value === 'object') {
        // sub proposal objects are hydrated, respecting circularity
        if (value.hasOwnProperty('proposalType')) {
          return replaceObject(value)
        }

        // create rdf terms out of SPOs
        if (termsKeys.includes(key)) {
          if (value.hasOwnProperty('termType') && value.hasOwnProperty('value')) {
            if (termsTypes.hasOwnProperty(value.termType)) {
              return termsTypes[value.termType](value.value)
            }
          }
        }

        // create quads out of quad objects
        if (value.subject && value.predicate && value.object) {
          const { subject, predicate, object, graph } = value
          if (graph) {
            return rdf.quad(subject, predicate, object, graph)
          }
          return rdf.quad(subject, predicate, object)
        }
      }
      return value
    }
  }

  function proposalSerializer (proposalObject) {
    return stringify(proposalObject)
  }

  function proposalDeserializer (proposalObject) {
    const reviver = proposalReviver()
    if (typeof proposalObject !== 'string') {
      return parse(JSON.stringify(proposalObject), reviver)
    }
    return parse(proposalObject, reviver)
  }

  function proposalType (proposalObject) {
    if (!Array.isArray(proposalObject)) {
      return ''
    }
    const index = proposalObject[0]
    const valueAt = _get(index, ['proposalType'], NaN)
    return _get(proposalObject, valueAt, '')
  }
}
