export class InvalidLineError extends Error {
  constructor(line: number) {
    super(`'${line}' does not exist`)
    this.name = 'InvalidLineError'
  }
}

export class MissingTargetLineError extends Error {
  constructor(targetLines: number, minTargetLines: number) {
    super(`min target lines: ${minTargetLines}, received: ${targetLines}`)
    this.name = 'MissingTargetLineError'
  }
}
