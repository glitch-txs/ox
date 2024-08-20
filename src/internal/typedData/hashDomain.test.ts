import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'
import { hashDomain } from './hashDomain.js'

test('default', () => {
  expect(
    hashDomain({
      ...typedData.basic,
      domain: typedData.basic.domain,
    }),
  ).toMatchInlineSnapshot(
    `"0x6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1"`,
  )
})
