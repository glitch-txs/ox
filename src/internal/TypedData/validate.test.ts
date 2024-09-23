import { TypedData } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    TypedData.validate({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: 1n,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    }),
  ).toBe(true)
})

test('negative uint', () => {
  expect(
    TypedData.validate({
      types: {
        EIP712Domain: [],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'favoriteNumber', type: 'uint8' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: 'Cow',
          favoriteNumber: -1,
        },
        to: {
          name: 'Bob',
          favoriteNumber: -50,
        },
      },
    }),
  ).toBe(false)
})

test('uint overflow', () => {
  expect(
    TypedData.validate({
      types: {
        EIP712Domain: [],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'favoriteNumber', type: 'uint8' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: 'Cow',
          favoriteNumber: 256,
        },
        to: {
          name: 'Bob',
          favoriteNumber: 0,
        },
      },
    }),
  ).toBe(false)
})

test('int underflow', () => {
  expect(
    TypedData.validate({
      types: {
        EIP712Domain: [],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'favoriteNumber', type: 'int8' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: 'Cow',
          favoriteNumber: -129,
        },
        to: {
          name: 'Bob',
          favoriteNumber: 0,
        },
      },
    }),
  ).toBe(false)
})

test('invalid address', () => {
  expect(
    TypedData.validate({
      types: {
        EIP712Domain: [],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: 'Cow',
          wallet: '0x0000000000000000000000000000000000000000',
        },
        to: {
          name: 'Bob',
          wallet: '0x000000000000000000000000000000000000z',
        },
      },
    }),
  ).toBe(false)
})

test('bytes size mismatch', () => {
  expect(
    TypedData.validate({
      types: {
        EIP712Domain: [],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'hash', type: 'bytes32' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: 'Cow',
          hash: '0x0000000000000000000000000000000000000000',
        },
        to: {
          name: 'Bob',
          hash: '0x0000000000000000000000000000000000000000',
        },
      },
    }),
  ).toBe(false)
})

test('domain: invalid chainId', () => {
  expect(
    TypedData.validate({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: -1n,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    }),
  ).toBe(false)
})

test('domain: invalid contract', () => {
  expect(
    TypedData.validate({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: 1n,
        verifyingContract: '0xCczCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    }),
  ).toBe(false)
})

test('EIP712Domain as primaryType', () => {
  expect(
    TypedData.validate({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: 1n,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'EIP712Domain',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
    }),
  ).toBe(true)
})

test('primaryType: does not exist in types', () => {
  expect(
    TypedData.validate({
      types: {
        EIP712Domain: [],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'hash', type: 'bytes32' },
        ],
      },
      // @ts-expect-error
      primaryType: 'Foo',
      message: {
        from: {
          name: 'Cow',
          hash: '0x0000000000000000000000000000000000000000',
        },
        to: {
          name: 'Bob',
          hash: '0x0000000000000000000000000000000000000000',
        },
      },
    }),
  ).toBe(false)
})
