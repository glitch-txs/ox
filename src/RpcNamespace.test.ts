import { expect, test } from 'vitest'
import * as exports from './RpcNamespace.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot('[]')
})
