import { secp256r1 } from '@noble/curves/p256'

import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import type { Signature } from '../Signature/types.js'

/**
 * Signs the payload with the provided private key and returns a P256 signature.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const signature = P256.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The ECDSA {@link ox#Signature.Signature}.
 */
export function P256_sign(options: P256_sign.Options): Signature {
  const { hash, payload, privateKey } = options
  const { r, s, recovery } = secp256r1.sign(
    payload instanceof Uint8Array ? payload : Bytes.fromHex(payload),
    privateKey instanceof Uint8Array ? privateKey : Bytes.fromHex(privateKey),
    ...(hash ? [{ prehash: true, lowS: true }] : []),
  )
  return {
    r,
    s,
    yParity: recovery,
  }
}

export declare namespace P256_sign {
  type Options = {
    /** If set to `true`, the payload will be hashed (sha256) before being signed. */
    hash?: boolean | undefined
    /** Payload to sign. */
    payload: Hex | Bytes.Bytes
    /** ECDSA private key. */
    privateKey: Hex | Bytes.Bytes
  }

  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
P256_sign.parseError = (error: unknown) => error as P256_sign.ErrorType
