export class FieldsSanitizer {
  static validateAll(options: string[]) {
    const json = {}

    options.forEach(option => {
      const splitOption = this.validateAndSanitize(option)

      json[splitOption[0]] = splitOption[1]
    })

    return json
  }

  static validateAndSanitize(option: string) {
    const splitOption = option.split('=')

    if (splitOption.length > 2 || splitOption.length < 2) {
      throw new Error('Option must follow key=value pattern.')
    }

    splitOption[0].trim()
    splitOption[1].trim()

    return splitOption
  }
}
