import { dirname } from 'path'
import { readFile } from 'fs/promises'
import { Templating } from '../src/Templating'

describe('\n Templating Class', () => {
  it('should be able to load templates folder', async () => {
    const templating = new Templating()

    const templates = await templating.load()

    expect(templates.has('config-map.yml')).toBe(true)
    expect(templates.has('deployment.yml')).toBe(true)
  })

  it('should be able to format environment variables', async () => {
    const templating = new Templating()

    await templating.load()

    process.env.HOST = 'http://127.0.0.1'
    process.env.PORT = '3000'
    process.env.NODE_ENV = 'production'

    const templates = await templating.formatEnvs()

    const configMapTemplate = templates.get('config-map.yml')

    expect(configMapTemplate.includes('3000')).toBe(true)
    expect(configMapTemplate.includes('production')).toBe(true)
    expect(configMapTemplate.includes('http://127.0.0.1')).toBe(true)
  })

  it('should be able to format environment variables and extra fields', async () => {
    const templating = new Templating()

    await templating.load()

    process.env.HOST = 'http://127.0.0.1'
    process.env.PORT = '3000'
    process.env.NODE_ENV = 'production'

    await templating.formatEnvs()

    const templates = await templating.formatFields({
      IMAGE_TAG: 'jlenon7/templating:latest',
    })

    const configMapTemplate = templates.get('config-map.yml')
    const deploymentTemplate = templates.get('deployment.yml')

    expect(configMapTemplate.includes('3000')).toBe(true)
    expect(configMapTemplate.includes('production')).toBe(true)
    expect(configMapTemplate.includes('http://127.0.0.1')).toBe(true)
    expect(deploymentTemplate.includes('jlenon7/templating:latest')).toBe(true)
  })

  it('should be able to generate the formatted templates', async () => {
    const templatesPath = process.cwd() + '/manifest/templates'

    const templating = new Templating()

    await templating.load(templatesPath)

    process.env.HOST = 'http://127.0.0.1'
    process.env.PORT = '3000'
    process.env.NODE_ENV = 'production'

    await templating.formatEnvs()
    await templating.formatFields({ IMAGE_TAG: 'jlenon7/templating:latest' })

    await templating.generate()

    const file = await readFile(dirname(templatesPath) + '/deployment.yml')

    expect(file.toString().includes('jlenon7/templating:latest')).toBe(true)
  })
})
