import rdf from 'rdf-ext'
import QuadExt from 'rdf-ext/lib/Quad'
import Resource from './Resource'
import { firstVal, datasetToCanonicalN3, normalizeLabel } from '@/libs/utils'

export default ({ app, store }, inject) => {
  class Class extends Resource {
    constructor (args = {}) {
      super(args)

      const {
        baseIRI = store.state.config.ontology.classBaseUrl,
        iri = '',
        equivalentClass = [],
        // equivalentClass removed from this Class, only used when editing a Class
        equivalentClassRemoved = [], // Array<string iri>
        subClass = '',
        // subClass removed from this Class, only used when editing a Class
        subClassRemoved = [], // Array<string iri>
        // properties newly added to this Class
        propChildren = [] // Array<Quad|Property>
      } = args

      this.proposalType = 'Class'
      this.rdfType = app.$termIRI.Class

      this.baseIRI = baseIRI
      this.iri = iri || this.baseIRI + normalizeLabel(this.label, 'pascal')

      this.equivalentClass = equivalentClass
      this.equivalentClassRemoved = equivalentClassRemoved

      this.subClass = subClass
      this.subClassRemoved = subClassRemoved

      this.propChildren = propChildren
    }

    validate () {
      super.validate()

      if (!/^([A-Z])/.test(this.label)) {
        throw new Error('Class `label` should start with an uppercase letter')
      }
    }

    proposalDataset (validation = true) {
      // proposalDataset only contains changed/newer quads, things to remove
      // from the ontology (e.g. when editing a class to delete a property) need to
      // be handled later
      if (validation) {
        this.validate()
      }

      const classIRI = rdf.namedNode(this.iri)
      const quads = [
        rdf.quad(classIRI, app.$termIRI.a, this.rdfType),
        rdf.quad(classIRI, app.$termIRI.label, rdf.literal(this.label)),
        rdf.quad(classIRI, app.$termIRI.comment, rdf.literal(this.comment))
      ]

      if (this.description) {
        quads.push(rdf.quad(classIRI, app.$termIRI.description, rdf.literal(this.description, app.$termIRI.markdown)))
      }
      if (this.example) {
        quads.push(rdf.quad(classIRI, app.$termIRI.example, rdf.literal(this.example)))
      }

      if (this.isDeprecated) {
        quads.push(rdf.quad(classIRI, app.$termIRI.deprecated, rdf.literal('true', rdf.namedNode('xsd:boolean'))))
      }

      if (this.equivalentClass.length) {
        const existingEquivalentClassQuads = this.equivalentClass.reduce((xs, equivalentClass) => {
          let equivalentClassIRI
          if (equivalentClass instanceof QuadExt) {
            equivalentClassIRI = equivalentClass.subject
          }
          else {
            equivalentClassIRI = rdf.namedNode(equivalentClass.iri)
          }
          xs.push(rdf.quad(classIRI, app.$termIRI.equivalentClass, equivalentClassIRI))
          return xs
        }, [])
        quads.push(...existingEquivalentClassQuads)
      }

      if (this.subClass) {
        quads.push(
          rdf.quad(classIRI, app.$termIRI.subClassOf, this.subClass.subject)
        )
      }

      if (this.domains.length) {
        const existingDomainsQuads = this.domains.reduce((xs, domain) => {
          let domainIRI
          if (domain instanceof QuadExt) {
            domainIRI = domain.subject
          }
          else {
            domainIRI = rdf.namedNode(domain.iri)
          }
          xs.push(rdf.quad(domainIRI, app.$termIRI.domain, classIRI))
          return xs
        }, [])
        quads.push(...existingDomainsQuads)
      }

      const structureQuads = [
        rdf.quad(rdf.namedNode(this.parentStructureIRI), app.$termIRI.hasPart, classIRI)
      ]

      const ontology = rdf.dataset(quads)
      const structure = rdf.dataset(structureQuads)

      return (this.propChildren || []).reduce((acc, propChild) => {
        // dubious
        const childDatasets = propChild.proposalDataset(validation)

        const ontology = acc.ontology.merge(childDatasets.ontology)
        // child classes should not become structure objects i.e. logistic objects
        // const structure = acc.structure.merge(childDatasets.structure)

        return { ontology, structure }
      }, { ontology, structure })
    }

    generateProposal (data) {
      const ontology = data.ontology
      const structure = data.structure
      const datasets = this.proposalDataset()

      if (this.isEdit && this.originalIRI) {
        datasets.ontology = app.$mergedEditedOntology(this.originalIRI, this.iri, ontology, datasets.ontology)
        datasets.structure = app.$mergedEditedOntology(this.originalIRI, this.iri, structure, datasets.structure)

        this.domainsRemoved.forEach(({ iri }) => {
          datasets.ontology.removeMatches(rdf.namedNode(iri), app.$termIRI.domain, rdf.namedNode(this.iri))
        })

        this.equivalentClassRemoved.forEach((iri) => {
          datasets.ontology.removeMatches(rdf.namedNode(this.iri), app.$termIRI.equivalentClass, rdf.namedNode(iri))
        })

        this.subClassRemoved.forEach((iri) => {
          datasets.ontology.removeMatches(rdf.namedNode(this.iri), app.$termIRI.subClassOf, rdf.namedNode(iri))
        })

        return {
          ontologyContent: datasetToCanonicalN3(datasets.ontology),
          structureContent: datasetToCanonicalN3(datasets.structure)
        }
      }

      return {
        ontologyContent: datasetToCanonicalN3(ontology.merge(datasets.ontology)),
        structureContent: datasetToCanonicalN3(structure.merge(datasets.structure))
      }
    }

    static hydrate ({ ontology, structure }, iri) {
      const existingClassIRI = rdf.namedNode(iri)
      const parent = structure.match(null, null, existingClassIRI).toArray()
      const parentStructureIRI = parent.length ? parent[0].subject.value : ''

      const labelQuad = firstVal(ontology.match(existingClassIRI, app.$termIRI.label).toArray())
      const commentQuad = firstVal(ontology.match(existingClassIRI, app.$termIRI.comment).toArray())
      const descriptionQuad = firstVal(ontology.match(existingClassIRI, app.$termIRI.description).toArray())
      const exampleQuad = firstVal(ontology.match(existingClassIRI, app.$termIRI.example).toArray())

      const data = {
        isEdit: true,
        isDraft: true,
        motivation: '',
        iri,
        originalIRI: iri,
        label: labelQuad ? labelQuad.object.value : '',
        comment: commentQuad ? commentQuad.object.value : '',
        description: descriptionQuad ? descriptionQuad.object.value : '',
        example: exampleQuad ? exampleQuad.object.value : '',
        domains: ontology.match(null, app.$termIRI.domain, existingClassIRI).toArray().map(hydrateDomain),
        equivalentClass: ontology.match(existingClassIRI, app.$termIRI.equivalentClass, null).toArray().map(hydrateEquivalentClass),
        subClass: firstVal(ontology.match(existingClassIRI, app.$termIRI.subClassOf, null).toArray().map(hydrateSubClass)),
        parentStructureIRI,
        propChildren: [],
        isSubFormCollapsed: false,
        isNew: false
      }
      const clss = new Class(data)
      return clss

      function hydrateDomain (quad) {
        const quads = ontology.match(quad.subject)
        const domainQuad = firstVal(quads.match(quad.subject, app.$termIRI.a, app.$termIRI.Property).toArray())
        const commentQuad = firstVal(quads.match(quad.subject, app.$termIRI.comment).toArray())
        const labelQuad = firstVal(quads.match(quad.subject, app.$termIRI.label).toArray())
        return {
          iri: quad.subject.value,
          matched: '',
          label: labelQuad ? labelQuad.object.value : '',
          comment: commentQuad ? commentQuad.object.value : '',
          domain: domainQuad
        }
      }

      function hydrateEquivalentClass (quad) {
        const labelQuad = ontology.match(quad.object, app.$termIRI.label).toArray()
        if (labelQuad.length) {
          return firstVal(labelQuad)
        }

        // otherwise it's an external IRI
        return app.$externalIRIToQuad(quad.object.value)
      }

      function hydrateSubClass (quad) {
        const labelQuad = ontology.match(quad.object, app.$termIRI.label).toArray()
        if (labelQuad.length) {
          return firstVal(labelQuad)
        }

        // otherwise it's an external IRI
        return app.$externalIRIToQuad(quad.object.value)
      }
    }
  }

  inject('Class', Class)
}
