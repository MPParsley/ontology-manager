import rdf from 'rdf-ext'
import N3Parser from 'rdf-parser-n3'
import { Readable } from 'readable-stream'
import resourcesToGraph from 'rdf-utils-dataset/resourcesToGraph'
import { serialize, buildTree } from '@/libs/utils'
import { buildSearchIndex } from '@/libs/rdf'
import { DESERIALIZE } from '@/store/action-types'

export const state = () => ({
  ontology: {},
  structure: {},
  ontologySerialized: '',
  structureSerialized: '',
  ontologyGraph: {},
  structureGraph: {},
  structureTree: {},
  searchIndex: {},
  clientReady: false
})

export const getters = {
  ontology: (state) => {
    if (!(state.ontology instanceof rdf.defaults.Dataset)) {
      return rdf.dataset()
    }
    return state.ontology.clone()
  },
  structure: (state) => {
    if (!(state.structure instanceof rdf.defaults.Dataset)) {
      return rdf.dataset()
    }
    return state.structure.clone()
  },
  ontologyGraph: (state) => {
    if (!(state.ontologyGraph instanceof rdf.defaults.Dataset)) {
      return rdf.dataset()
    }
    return state.ontologyGraph.clone()
  },
  structureGraph: (state) => state.structureGraph,
  structureTree: (state) => state.structureTree,
  clientReady: (state) => state.clientReady
}

export const mutations = {
  ontologyInit (state, ontologyDataset) {
    state.ontologySerialized = serialize(ontologyDataset)
    state.ontology = ontologyDataset
    state.ontologyGraph = resourcesToGraph(ontologyDataset)
    state.searchIndex = buildSearchIndex(ontologyDataset)
  },
  structureInit (state, structureDataset) {
    state.structureSerialized = serialize(structureDataset)
    state.structure = structureDataset
    state.structureGraph = resourcesToGraph(structureDataset)
    state.structureTree = buildTree(structureDataset, this.state.graph.ontology)
  },
  clientReady (state) {
    state.clientReady = true
  }
}

export const actions = {
  async [DESERIALIZE] ({ commit, state }) {
    const toDeserialize = ['ontology', 'structure']
      .filter((prop) => !(state[prop] instanceof rdf.defaults.Dataset))

    const deserialized = await Promise.all(
      toDeserialize.map((prop) => deserialize(state[`${prop}Serialized`]))
    )

    toDeserialize.forEach((prop, i) => {
      commit(`${prop}Init`, deserialized[i])
    })
    commit('clientReady')
    return Promise.resolve('deserialized')
  }
}

async function deserialize (string) {
  const parser = new N3Parser({ factory: rdf })

  const input = new Readable({
    read: () => {
      input.push(string)
      input.push(null)
    }
  })

  const quadStream = parser.import(input)
  const dataset = await rdf.dataset().import(quadStream)
  return dataset
}
