import { type HexToBytesErrorType, hexToBytes } from '../bytes/toBytes.js'
import { BaseError } from '../errors/base.js'
import type { ErrorType } from '../errors/error.js'
import { type BytesToHexErrorType, bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'
import {
  type CreateCursorErrorType,
  type Cursor,
  createCursor,
} from '../utils/cursor.js'

export type RecursiveArray<T> = T | readonly RecursiveArray<T>[]

type To = 'hex' | 'bytes'

type Encodable = {
  length: number
  encode(cursor: Cursor): void
}

export type ToRlpReturnType<to extends To> =
  | (to extends 'bytes' ? Bytes : never)
  | (to extends 'hex' ? Hex : never)

export type ToRlpErrorType =
  | CreateCursorErrorType
  | BytesToHexErrorType
  | HexToBytesErrorType
  | ErrorType

/**
 * Encodes a {@link Bytes} or {@link Hex} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * import { Rlp } from 'ox'
 * Rlp.encode('0x68656c6c6f20776f726c64')
 * // 0x8b68656c6c6f20776f726c64
 */
export function toRlp<
  bytes extends RecursiveArray<Bytes> | RecursiveArray<Hex>,
  to extends To = bytes extends RecursiveArray<Bytes> ? 'bytes' : 'hex',
>(bytes: bytes, to_?: to | To | undefined): ToRlpReturnType<to> {
  const encodable = getEncodable(bytes)
  const cursor = createCursor(new Uint8Array(encodable.length))
  encodable.encode(cursor)

  const to = to_ || getType(bytes)
  if (to === 'hex') return bytesToHex(cursor.bytes) as ToRlpReturnType<to>
  return cursor.bytes as ToRlpReturnType<to>
}

export type BytesToRlpErrorType = ToRlpErrorType | ErrorType

/**
 * Encodes a {@link Bytes} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * import { Rlp } from 'ox'
 * Rlp.fromBytes(Uint8Array([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100]))
 * // Uint8Array([104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 */
export function bytesToRlp<to extends To = 'bytes'>(
  bytes: RecursiveArray<Bytes>,
  to: to | To | undefined = 'bytes',
): ToRlpReturnType<to> {
  return toRlp(bytes, to)
}

export type HexToRlpErrorType = ToRlpErrorType | ErrorType

/**
 * Encodes a {@link Hex} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * import { Rlp } from 'ox'
 * Rlp.fromHex('0x68656c6c6f20776f726c64')
 * // 0x8b68656c6c6f20776f726c64
 */
export function hexToRlp<to extends To = 'hex'>(
  hex: RecursiveArray<Hex>,
  to: to | To | undefined = 'hex',
): ToRlpReturnType<to> {
  return toRlp(hex, to)
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

function getType(bytes: RecursiveArray<Bytes> | RecursiveArray<Hex>) {
  if (Array.isArray(bytes)) return getType(bytes[0])
  return typeof bytes === 'string' ? 'hex' : 'bytes'
}

function getEncodable(
  bytes: RecursiveArray<Bytes> | RecursiveArray<Hex>,
): Encodable {
  if (Array.isArray(bytes))
    return getEncodableList(bytes.map((x) => getEncodable(x)))
  return getEncodableBytes(bytes as any)
}

function getEncodableList(list: Encodable[]): Encodable {
  const bodyLength = list.reduce((acc, x) => acc + x.length, 0)

  const sizeOfBodyLength = getSizeOfLength(bodyLength)
  const length = (() => {
    if (bodyLength <= 55) return 1 + bodyLength
    return 1 + sizeOfBodyLength + bodyLength
  })()

  return {
    length,
    encode(cursor: Cursor) {
      if (bodyLength <= 55) {
        cursor.pushByte(0xc0 + bodyLength)
      } else {
        cursor.pushByte(0xc0 + 55 + sizeOfBodyLength)
        if (sizeOfBodyLength === 1) cursor.pushUint8(bodyLength)
        else if (sizeOfBodyLength === 2) cursor.pushUint16(bodyLength)
        else if (sizeOfBodyLength === 3) cursor.pushUint24(bodyLength)
        else cursor.pushUint32(bodyLength)
      }
      for (const { encode } of list) {
        encode(cursor)
      }
    },
  }
}

function getEncodableBytes(bytesOrHex: Bytes | Hex): Encodable {
  const bytes =
    typeof bytesOrHex === 'string' ? hexToBytes(bytesOrHex) : bytesOrHex

  const sizeOfBytesLength = getSizeOfLength(bytes.length)
  const length = (() => {
    if (bytes.length === 1 && bytes[0]! < 0x80) return 1
    if (bytes.length <= 55) return 1 + bytes.length
    return 1 + sizeOfBytesLength + bytes.length
  })()

  return {
    length,
    encode(cursor: Cursor) {
      if (bytes.length === 1 && bytes[0]! < 0x80) {
        cursor.pushBytes(bytes)
      } else if (bytes.length <= 55) {
        cursor.pushByte(0x80 + bytes.length)
        cursor.pushBytes(bytes)
      } else {
        cursor.pushByte(0x80 + 55 + sizeOfBytesLength)
        if (sizeOfBytesLength === 1) cursor.pushUint8(bytes.length)
        else if (sizeOfBytesLength === 2) cursor.pushUint16(bytes.length)
        else if (sizeOfBytesLength === 3) cursor.pushUint24(bytes.length)
        else cursor.pushUint32(bytes.length)
        cursor.pushBytes(bytes)
      }
    },
  }
}

function getSizeOfLength(length: number) {
  if (length < 2 ** 8) return 1
  if (length < 2 ** 16) return 2
  if (length < 2 ** 24) return 3
  if (length < 2 ** 32) return 4
  throw new BaseError('Length is too large.')
}
