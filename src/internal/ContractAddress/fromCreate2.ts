import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { Address_from } from '../Address/from.js'
import type { Address } from '../Address/types.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'

/**
 * Computes contract address via [CREATE2](https://eips.ethereum.org/EIPS/eip-1014) opcode.
 *
 * @example
 * ```ts twoslash
 * import { ContractAddress, Hex } from 'ox'
 *
 * ContractAddress.fromCreate2({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   bytecode: '0x6394198df16000526103ff60206004601c335afa6040516060f3',
 *   salt: Hex.fromString('hello world'),
 * })
 * // @log: '0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB'
 * ```
 *
 * @param options - Options for retrieving address.
 * @returns Contract Address.
 */
export function ContractAddress_fromCreate2(
  options: ContractAddress_fromCreate2.Options,
): Address {
  const from = Bytes.fromHex(Address_from(options.from))
  const salt = Bytes.padLeft(
    Bytes.validate(options.salt) ? options.salt : Bytes.fromHex(options.salt),
    32,
  )

  const bytecodeHash = (() => {
    if ('bytecodeHash' in options) {
      if (Bytes.validate(options.bytecodeHash)) return options.bytecodeHash
      return Bytes.fromHex(options.bytecodeHash)
    }
    return Hash_keccak256(options.bytecode, { as: 'Bytes' })
  })()

  return Address_from(
    Hex.slice(
      Hash_keccak256(
        Bytes.concat(Bytes.fromHex('0xff'), from, salt, bytecodeHash),
        { as: 'Hex' },
      ),
      12,
    ),
  )
}

export declare namespace ContractAddress_fromCreate2 {
  type Options =
    | {
        bytecode: Bytes.Bytes | Hex.Hex
        from: Address
        salt: Bytes.Bytes | Hex.Hex
      }
    | {
        bytecodeHash: Bytes.Bytes | Hex.Hex
        from: Address
        salt: Bytes.Bytes | Hex.Hex
      }

  type ErrorType =
    | Address_from.ErrorType
    | Bytes.concat.ErrorType
    | Bytes.validate.ErrorType
    | Bytes.padLeft.ErrorType
    | Hash_keccak256.ErrorType
    | Hex.slice.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

ContractAddress_fromCreate2.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as ContractAddress_fromCreate2.ErrorType
