import type * as LogicErrors from './errors'

export type LogicError = keyof typeof LogicErrors

export * from './actions'
export * from './resolve'
export * from './describe'
