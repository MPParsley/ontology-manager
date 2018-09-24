import { resolve } from 'path'
import { Nuxt, Builder } from 'nuxt'
import dotenv from 'dotenv'
import axios from 'axios'

jest.setTimeout(60000)

// https://github.com/axios/axios/issues/960#issuecomment-320659373
axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.resolve(error.response)
)

// https://nuxtjs.org/guide/development-tools#end-to-end-testing
const getJSONLD = (url) => axios.get(`http://localhost:4000${url}`, { headers: { accept: 'application/ld+json' } })
const getRDFXML = (url) => axios.get(`http://localhost:4000${url}`, { headers: { accept: 'application/rdf+xml' } })
const getNT = (url) => axios.get(`http://localhost:4000${url}`, { headers: { accept: 'application/n-triples' } })
const getTURTLE = (url) => axios.get(`http://localhost:4000${url}`, { headers: { accept: 'text/turle' } })
const getHTML = (url) => axios.get(`http://localhost:4000${url}`, { headers: { accept: 'text/html' } })

// We keep the nuxt and server instance
// So we can close them at the end of the test
let nuxt = null

// Init Nuxt.js and create a server listening on localhost:4000
describe('basic dev', () => {
  beforeAll(async () => {
    // load env vars
    dotenv.config()

    const config = {
      dev: true,
      rootDir: resolve(__dirname, '..'),
      ...require(resolve(__dirname, '../nuxt.config.js'))
    }
    nuxt = new Nuxt(config)
    await new Builder(nuxt).build()
    await nuxt.listen(4000, 'localhost')
  })

  // Close server and ask nuxt to stop listening to file changes
  afterAll(async () => {
    await nuxt.close()
  })

  test('render HTML', async () => {
    const context = {}
    const { html } = await nuxt.renderRoute('/', context)
    expect(html).toContain('<!DOCTYPE html>')
  })

  describe('Route /', () => {
    test('html for html', async () => {
      const result = await getHTML('/')

      expect(result.status).toBe(200)
      expect(result.data).toContain('<!DOCTYPE html>')
    })

    test('html for jsonld', async () => {
      const result = await getJSONLD('/')

      expect(result.status).toBe(200)
      expect(() => JSON.parse(result.data)).toThrow()

      expect(result.data).toContain('<!DOCTYPE html>')
    })

    test('html for rdfxml', async () => {
      const result = await getRDFXML('/')

      expect(result.status).toBe(200)
      expect(result.data).toContain('<!DOCTYPE html>')
    })

    test('html for nt', async () => {
      const result = await getNT('/')

      expect(result.status).toBe(200)
      expect(result.data).toContain('<!DOCTYPE html>')
    })

    test('html for turtle', async () => {
      const result = await getTURTLE('/')

      expect(result.status).toBe(200)
      expect(result.data).toContain('<!DOCTYPE html>')
    })
  })

  describe('Renders IRI from dataset wrt Accept header', () => {
    test('html for html', async () => {
      const result = await getHTML('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)
      expect(result.data).toContain('<!DOCTYPE html>')
    })

    test('json for jsonld', async () => {
      const result = await getJSONLD('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)
      expect(Object.keys(result.data)).toMatchSnapshot()
    })

    test('html for rdfxml', async () => {
      const result = await getRDFXML('/pouch/CargoHandlersPouch')

      // NotAcceptableError: no serializer found
      //   at ServerResponse.sendGraph [as graph] (ontology-editor/node_modules/rdf-body-parser/index.js:28:29)
      //   at rdfBodyParser.attach.then.then (ontology-editor/node_modules/trifid-handler-fetch/index.js:53:18)
      expect(result.status).toBe(406)
      expect(result.data).toContain('<!DOCTYPE html>')
    })

    test('html for nt', async () => {
      const result = await getNT('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(200)
      expect(result.data).toMatchSnapshot()
    })

    test('html for turtle', async () => {
      const result = await getTURTLE('/pouch/CargoHandlersPouch')

      expect(result.status).toBe(404)
      expect(result.data).toContain('<!DOCTYPE html>')
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
