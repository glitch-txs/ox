import { hexToBytes } from '../bytes/toBytes.js'
import { assertSize } from '../data/assertSize.js'
import { trimLeft, trimRight } from '../data/trim.js'
import {
  InvalidHexBooleanError,
  type InvalidHexBooleanErrorType,
  InvalidTypeError,
  type InvalidTypeErrorType,
} from '../errors/data.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'string' | 'bytes' | 'bigint' | 'number' | 'boolean'

/**
 * Decodes a {@link Hex} value into a string, number, bigint, boolean, or {@link Bytes}.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.to('0x1a4', 'number')
 * // 420
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.to('0x48656c6c6f20576f726c6421', 'string')
 * // 'Hello world'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.to('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', 'string', {
 *   size: 32,
 * })
 * // 'Hello world'
 */
export declare namespace fromHex {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ReturnType<to> =
    | (to extends 'string' ? string : never)
    | (to extends 'bytes' ? Bytes : never)
    | (to extends 'bigint' ? bigint : never)
    | (to extends 'number' ? number : never)
    | (to extends 'boolean' ? boolean : never)

  type ErrorType =
    | hexToNumber.ErrorType
    | hexToBigInt.ErrorType
    | hexToBoolean.ErrorType
    | hexToString.ErrorType
    | hexToBytes.ErrorType
    | InvalidTypeErrorType
    | ErrorType_
}
export function fromHex<to extends To>(
  hex: Hex,
  to: to | To,
  options: fromHex.Options = {},
): fromHex.ReturnType<to> {
  if (to === 'number')
    return hexToNumber(hex, options) as fromHex.ReturnType<to>
  if (to === 'bigint')
    return hexToBigInt(hex, options) as fromHex.ReturnType<to>
  if (to === 'string')
    return hexToString(hex, options) as fromHex.ReturnType<to>
  if (to === 'boolean')
    return hexToBoolean(hex, options) as fromHex.ReturnType<to>
  if (to === 'bytes') return hexToBytes(hex, options) as fromHex.ReturnType<to>
  throw new InvalidTypeError(to)
}

/**
 * Decodes a {@link Hex} value into a BigInt.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBigInt('0x1a4')
 * // 420n
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420n
 */
export declare namespace hexToBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = assertSize.ErrorType | ErrorType_
}
export function hexToBigInt(
  hex: Hex,
  options: hexToBigInt.Options = {},
): bigint {
  const { signed } = options

  if (options.size) assertSize(hex, options.size)

  const value = BigInt(hex)
  if (!signed) return value

  const size = (hex.length - 2) / 2
  const max = (1n << (BigInt(size) * 8n - 1n)) - 1n
  if (value <= max) return value

  return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n
}

/**
 * Decodes a {@link Hex} value into a boolean.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBoolean('0x01')
 * // true
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBoolean('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // true
 */
export declare namespace hexToBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | trimLeft.ErrorType
    | InvalidHexBooleanErrorType
    | ErrorType_
}
export function hexToBoolean(
  hex_: Hex,
  options: hexToBoolean.Options = {},
): boolean {
  let hex = hex_
  if (options.size) {
    assertSize(hex, options.size)
    hex = trimLeft(hex)
  }
  if (trimLeft(hex) === '0x00') return false
  if (trimLeft(hex) === '0x01') return true
  throw new InvalidHexBooleanError(hex)
}

/**
 * Decodes a {@link Hex} value into a number.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toNumber('0x1a4')
 * // 420
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420
 */
export declare namespace hexToNumber {
  type Options = hexToBigInt.Options

  type ErrorType = hexToBigInt.ErrorType | ErrorType_
}
export function hexToNumber(
  hex: Hex,
  options: hexToNumber.Options = {},
): number {
  const { signed, size } = options
  if (!signed && !size) return Number(hex)
  return Number(hexToBigInt(hex, options))
}

/**
 * Decodes a {@link Hex} value into a UTF-8 string.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toString('0x48656c6c6f20576f726c6421')
 * // 'Hello world!'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toString('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *  size: 32,
 * })
 * // 'Hello world'
 */
export declare namespace hexToString {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | hexToBytes.ErrorType
    | trimRight.ErrorType
    | ErrorType_
}
export function hexToString(
  hex: Hex,
  options: hexToString.Options = {},
): string {
  const { size } = options

  let bytes = hexToBytes(hex)
  if (size) {
    assertSize(bytes, size)
    bytes = trimRight(bytes)
  }
  return new TextDecoder().decode(bytes)
}
