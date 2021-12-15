import { Logger } from '@secjs/logger'
import { getFiles } from '@secjs/utils'
import { parse, dirname, isAbsolute } from 'path'
import { readFile, writeFile } from 'fs/promises'

export class Templating {
  private templates = new Map()
  private templatesPath = ''
  private logger = new Logger(Templating.name)

  private matcher(key?: string) {
    if (key) return new RegExp(`{{\\s*${key}\\s*}}`, 'g')

    return /{{\s*.*\s*}}/g
  }

  async formatEnvs() {
    this.templates.forEach((template: string, templateKey: string) => {
      const fields = {}

      template.match(this.matcher()).forEach(match => {
        const key = match.replace('{{ ', '').replace(' }}', '')

        fields[key] = process.env[key] || match
      })

      Object.keys(fields).forEach(k => {
        const value = fields[k]

        if (value.includes('{{ ')) return

        this.logger.warn(`📝 Formatting ${k} to ${value}`, {
          context: 'EnvFormatter',
        })

        template = template.replace(this.matcher(k), value)
      })

      this.templates.set(templateKey, template)
    })

    return this.templates
  }

  async load(templatesPath = 'manifest/templates') {
    this.templatesPath = isAbsolute(templatesPath)
      ? templatesPath
      : `${process.cwd()}/${templatesPath}`

    for await (const file of getFiles(this.templatesPath)) {
      const fileBase = parse(file).base

      this.logger.success(`🔍 Template found: ${fileBase}`)

      this.templates.set(fileBase, (await readFile(file)).toString())
    }

    return this.templates
  }

  async formatFields(fields: any): Promise<Map<string, any>> {
    if (!fields) return

    this.templates.forEach((template, templateKey) => {
      Object.keys(fields).forEach(k => {
        const value = fields[k]

        this.logger.warn(`📝 Formatting ${k} to ${value}`, {
          context: 'FieldFormatter',
        })

        template = template.replace(this.matcher(k), value)
      })

      this.templates.set(templateKey, template)
    })

    return this.templates
  }

  async generate() {
    const promises = []

    this.templates.forEach((template, templateKey) => {
      this.logger.success(`🧬 Generating file from ${templateKey} template`)

      promises.push(
        writeFile(`${dirname(this.templatesPath)}/${templateKey}`, template),
      )
    })

    await Promise.all(promises)
  }
}
