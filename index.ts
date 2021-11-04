#!/usr/bin/env node

import chalk from 'chalk'
import figlet from 'figlet'

import { Command } from 'commander'
import { Logger } from '@secjs/logger'
import { dirname, resolve } from 'path'
import { Templating } from './src/Templating'
import { FieldsSanitizer } from './src/FieldsSanitizer'

const command = new Command()

const packageJson = require('./package.json')

command.version(packageJson.version, '-v, --version')

command
  .command('generate [path]')
  .description(
    'Generate the files according to template path and environment variables.',
  )
  .option('-s, --set [fields...]', 'Subscribe environment variables')
  .action(async (path, fields) => {
    const logger = new Logger('CLI')

    try {
      path = resolve(path)
      fields = FieldsSanitizer.validateAll(fields.set)

      const templating = new Templating()

      await templating.load(path)
      await templating.formatEnvs()
      await templating.formatFields(fields)

      await templating.generate()

      logger.success(`✅ All files generated inside -> ${dirname(path)}`)
    } catch (error) {
      logger.error(`❌ Something went wrong: ${error.toString()}`)
    }
  })

command.parse(process.argv)

console.log(chalk.green(figlet.textSync('Templating CLI')))

console.log('\n')

console.log(chalk.green(`🆚 Version: ${packageJson.version}`))
console.log(chalk.green(`👤 Maintainer: ${packageJson.author}`))

console.log('\n')
