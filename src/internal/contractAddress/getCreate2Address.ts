import type { Address } from 'abitype'

import { toAddress } from '../address/toAddress.js'
import { toBytes } from '../bytes/toBytes.js'
import { concatBytes } from '../bytes/concatBytes.js'
import { isBytes } from '../bytes/isBytes.js'
import { padBytes } from '../bytes/padBytes.js'
import { sliceHex } from '../hex/sliceHex.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Generates contract address via [CREATE2](https://eips.ethereum.org/EIPS/eip-1014) opcode.
 *
 * - Docs: https://oxlib.sh/api/contractAddress/getCreate2Address
 * - Spec: https://eips.ethereum.org/EIPS/eip-1014
 *
 * @example
 * ```ts twoslash
 * import { Bytes, ContractAddress, Hex } from 'ox'
 *
 * ContractAddress.getCreate2Address({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   bytecode: Bytes.from('0x6394198df16000526103ff60206004601c335afa6040516060f3'),
 *   salt: Hex.from('hello world'),
 * })
 * // '0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB'
 * ```
 */
export function getCreate2Address(opts: getCreate2Address.Options) {
  const from = toBytes(toAddress(opts.from))
  const salt = padBytes(isBytes(opts.salt) ? opts.salt : toBytes(opts.salt), {
    size: 32,
  })

  const bytecodeHash = (() => {
    if ('bytecodeHash' in opts) {
      if (isBytes(opts.bytecodeHash)) return opts.bytecodeHash
      return toBytes(opts.bytecodeHash)
    }
    return keccak256(opts.bytecode, 'Bytes')
  })()

  return toAddress(
    sliceHex(
      keccak256(concatBytes(toBytes('0xff'), from, salt, bytecodeHash)),
      12,
    ),
  )
}

export declare namespace getCreate2Address {
  type Options =
    | {
        bytecode: Bytes | Hex
        from: Address
        salt: Bytes | Hex
      }
    | {
        bytecodeHash: Bytes | Hex
        from: Address
        salt: Bytes | Hex
      }

  type ErrorType =
    | concatBytes.ErrorType
    | keccak256.ErrorType
    | toAddress.ErrorType
    | isBytes.ErrorType
    | padBytes.ErrorType
    | sliceHex.ErrorType
    | toBytes.ErrorType
    | GlobalErrorType
}

getCreate2Address.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getCreate2Address.ErrorType
