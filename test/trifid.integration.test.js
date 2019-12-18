import { resolve } from 'path'
import { Nuxt, Builder } from 'nuxt'
import axios from 'axios'

jest.setTimeout(100000)

// https://github.com/axios/axios/issues/960#issuecomment-320659373
axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.resolve(error.response)
)

// https://nuxtjs.org/guide/development-tools#end-to-end-testing
const getHTML = (url) => axios.get(`http://localhost:3000${url}`)
const getJSONLD = (url) => axios.get(`http://localhost:3000${url}`, { headers: { accept: 'application/ld+json' } })
const getNT = (url) => axios.get(`http://localhost:3000${url}`, { headers: { accept: 'application/n-triples' } })
const getRDFXML = (url) => axios.get(`http://localhost:3000${url}`, { headers: { accept: 'application/rdf+xml' } })
const getTURTLE = (url) => axios.get(`http://localhost:3000${url}`, { headers: { accept: 'text/turle' } })

// We keep the nuxt and server instance
// So we can close them at the end of the test
let nuxt = null

// Init Nuxt.js and create a server listening on localhost:4000
describe('basic dev', () => {
  beforeAll(async () => {
    try {
      const config = await require(resolve(__dirname, '../nuxt.config.js'))()
      nuxt = new Nuxt(config)
      await nuxt.ready()
      await new Builder(nuxt).build()
      await nuxt.listen(3000, 'localhost')
    }
    catch (err) {
      console.error(err)
    }
  })

  // Close server and ask nuxt to stop listening to file changes
  afterAll(async () => {
    return nuxt.close()
  })

  test('render HTML', async () => {
    const context = {}
    const { html } = await nuxt.renderRoute('/', context)
    return expect(html).toContain('<!doctype html>')
  })

  describe('Route /', () => {
    test('html for html', async () => {
      const result = await getHTML('/')

      expect(result.status).toBe(200)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })

    test('html for jsonld', async () => {
      const result = await getJSONLD('/')

      expect(result.status).toBe(200)
      expect(() => JSON.parse(result.data)).toThrow()

      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })

    test('html for rdfxml', async () => {
      const result = await getRDFXML('/')

      expect(result.status).toBe(200)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })

    test('html for nt', async () => {
      const result = await getNT('/')

      expect(result.status).toBe(200)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })

    test('html for turtle', async () => {
      const result = await getTURTLE('/')

      expect(result.status).toBe(200)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })
  })

  describe('Renders IRI from dataset wrt Accept header', () => {
    test('jsonld in html', async () => {
      const result = await getHTML('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)

      const found = result.data.match(/type="application\/ld\+json" id="data">([\s\S]+?)]<\/script>/m)
      expect(found[1]).toMatchSnapshot()
    })

    test('html for html', async () => {
      const result = await getHTML('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })

    test('json for jsonld', async () => {
      const result = await getJSONLD('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)
      expect(Object.keys(result.data)).toMatchSnapshot()
    })

    test('html for rdfxml', async () => {
      const result = await getRDFXML('/pouch/CargoHandlersPouch')

      // NotAcceptableError: no serializer found
      //   at ServerResponse.sendGraph [as graph] (ontology-manager/node_modules/rdf-body-parser/index.js:28:29)
      //   at rdfBodyParser.attach.then.then (ontology-manager/node_modules/trifid-handler-fetch/index.js:53:18)
      expect(result.status).toBe(406)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })

    test('html for nt', async () => {
      const result = await getNT('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)
      expect(result.data).toMatchSnapshot()
    })

    test('html for turtle', async () => {
      const result = await getTURTLE('/pouch/CargoHandlersPouch')
      expect(result.status).toBe(200)
      expect(result.data.toLowerCase()).toContain('<!doctype html>')
    })
  })

  describe('Renders 404 for IRI not in dataset', () => {
    test('html for html', async () => {
      const result = await getHTML('/pouch/CargoFOOBARPouch')

      expect(result.status).toBe(404)
    })

    test('json for jsonld', async () => {
      const result = await getJSONLD('/pouch/CargoFOOBARPouch')

      expect(result.status).toBe(404)
    })

    test('html for rdfxml', async () => {
      const result = await getRDFXML('/pouch/CargoFOOBARPouch')

      expect(result.status).toBe(404)
    })

    test('html for nt', async () => {
      const result = await getNT('/pouch/CargoFOOBARPouch')

      expect(result.status).toBe(404)
    })

    test('html for turtle', async () => {
      const result = await getTURTLE('/pouch/CargoFOOBARPouch')

      expect(result.status).toBe(404)
    })
  })
})
