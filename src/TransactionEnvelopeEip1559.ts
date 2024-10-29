import type { Errors } from './Errors.js'
import { Hex } from './Hex.js'
import type { Signature } from './Signature.js'
import { TransactionEnvelope } from './TransactionEnvelope.js'
import { AccessList_fromTupleList } from './internal/AccessList/fromTupleList.js'
import { AccessList_toTupleList } from './internal/AccessList/toTupleList.js'
import type { AccessList } from './internal/AccessList/types.js'
import { Address_assert } from './internal/Address/assert.js'
import { Hash_keccak256 } from './internal/Hash/keccak256.js'
import { Rlp_fromHex } from './internal/Rlp/from.js'
import { Rlp_toHex } from './internal/Rlp/to.js'
import { Signature_extract } from './internal/Signature/extract.js'
import { Signature_from } from './internal/Signature/from.js'
import { Signature_fromTuple } from './internal/Signature/fromTuple.js'
import { Signature_toRpc } from './internal/Signature/toRpc.js'
import { Signature_toTuple } from './internal/Signature/toTuple.js'
import type {
  Assign,
  Compute,
  PartialBy,
  UnionPartialBy,
} from './internal/types.js'

export type TransactionEnvelopeEip1559<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelopeEip1559.Type,
> = Compute<
  TransactionEnvelope.Base<type, signed, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigintType | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigintType | undefined
  }
>
export namespace TransactionEnvelopeEip1559 {
  // #region Types

  export type Rpc<signed extends boolean = boolean> =
    TransactionEnvelopeEip1559<signed, Hex, Hex, '0x2'>

  export type Serialized = `${SerializedType}${string}`

  export const serializedType = '0x02' as const
  export type SerializedType = typeof serializedType

  export type Signed = TransactionEnvelopeEip1559<true>

  export const type = 'eip1559' as const
  export type Type = typeof type

  // #endregion

  // #region Functions

  /**
   * Asserts a {@link ox#(TransactionEnvelopeEip1559:type)} is valid.
   *
   * @example
   * ```ts twoslash
   * import { TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * TransactionEnvelopeEip1559.assert({
   *   maxFeePerGas: 2n ** 256n - 1n + 1n,
   *   chainId: 1,
   *   to: '0x0000000000000000000000000000000000000000',
   *   value: Value.fromEther('1'),
   * })
   * // @error: FeeCapTooHighError:
   * // @error: The fee cap (`masFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913 gwei) cannot be
   * // @error: higher than the maximum allowed value (2^256-1).
   * ```
   *
   * @param envelope - The transaction envelope to assert.
   */
  export function assert(
    envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
  ) {
    const { chainId, maxPriorityFeePerGas, maxFeePerGas, to } = envelope
    if (chainId <= 0)
      throw new TransactionEnvelope.InvalidChainIdError({ chainId })
    if (to) Address_assert(to, { strict: false })
    if (maxFeePerGas && BigInt(maxFeePerGas) > 2n ** 256n - 1n)
      throw new TransactionEnvelope.FeeCapTooHighError({ feeCap: maxFeePerGas })
    if (
      maxPriorityFeePerGas &&
      maxFeePerGas &&
      maxPriorityFeePerGas > maxFeePerGas
    )
      throw new TransactionEnvelope.TipAboveFeeCapError({
        maxFeePerGas,
        maxPriorityFeePerGas,
      })
  }

  export declare namespace assert {
    type ErrorType =
      | Address_assert.ErrorType
      | TransactionEnvelope.InvalidChainIdError
      | TransactionEnvelope.FeeCapTooHighError
      | TransactionEnvelope.TipAboveFeeCapError
      | Errors.GlobalErrorType
  }

  assert.parseError = (error: unknown) =>
    /* v8 ignore next */
    error as assert.ErrorType

  /**
   * Deserializes a {@link ox#(TransactionEnvelopeEip1559:type)} from its serialized form.
   *
   * @example
   * ```ts twoslash
   * import { TransactionEnvelopeEip1559 } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.deserialize('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
   * // @log: {
   * // @log:   type: 'eip1559',
   * // @log:   nonce: 785n,
   * // @log:   maxFeePerGas: 2000000000n,
   * // @log:   gas: 1000000n,
   * // @log:   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
   * // @log:   value: 1000000000000000000n,
   * // @log: }
   * ```
   *
   * @param serializedTransaction - The serialized transaction.
   * @returns Deserialized Transaction Envelope.
   */
  export function deserialize(
    serializedTransaction: TransactionEnvelopeEip1559.Serialized,
  ): Compute<TransactionEnvelopeEip1559> {
    const transactionArray = Rlp_toHex(Hex.slice(serializedTransaction, 1))

    const [
      chainId,
      nonce,
      maxPriorityFeePerGas,
      maxFeePerGas,
      gas,
      to,
      value,
      data,
      accessList,
      yParity,
      r,
      s,
    ] = transactionArray as readonly Hex[]

    if (!(transactionArray.length === 9 || transactionArray.length === 12))
      throw new TransactionEnvelope.InvalidSerializedError({
        attributes: {
          chainId,
          nonce,
          maxPriorityFeePerGas,
          maxFeePerGas,
          gas,
          to,
          value,
          data,
          accessList,
          ...(transactionArray.length > 9
            ? {
                yParity,
                r,
                s,
              }
            : {}),
        },
        serializedTransaction,
        type: 'eip1559',
      })

    let transaction = {
      chainId: Number(chainId),
      type: 'eip1559',
    } as TransactionEnvelopeEip1559
    if (Hex.validate(to) && to !== '0x') transaction.to = to
    if (Hex.validate(gas) && gas !== '0x') transaction.gas = BigInt(gas)
    if (Hex.validate(data) && data !== '0x') transaction.data = data
    if (Hex.validate(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
    if (Hex.validate(value) && value !== '0x') transaction.value = BigInt(value)
    if (Hex.validate(maxFeePerGas) && maxFeePerGas !== '0x')
      transaction.maxFeePerGas = BigInt(maxFeePerGas)
    if (Hex.validate(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
      transaction.maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas)
    if (accessList!.length !== 0 && accessList !== '0x')
      transaction.accessList = AccessList_fromTupleList(accessList as any)

    const signature =
      r && s && yParity ? Signature_fromTuple([yParity, r, s]) : undefined
    if (signature)
      transaction = {
        ...transaction,
        ...signature,
      } as TransactionEnvelopeEip1559

    TransactionEnvelopeEip1559.assert(transaction)

    return transaction
  }

  export declare namespace deserialize {
    type ErrorType = Errors.GlobalErrorType
  }

  deserialize.parseError = (error: unknown) =>
    /* v8 ignore next */
    error as deserialize.ErrorType

  /**
   * Converts an arbitrary transaction object into an EIP-1559 Transaction Envelope.
   *
   * @example
   * ```ts twoslash
   * import { TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   maxFeePerGas: Value.fromGwei('10'),
   *   maxPriorityFeePerGas: Value.fromGwei('1'),
   *   to: '0x0000000000000000000000000000000000000000',
   *   value: Value.fromEther('1'),
   * })
   * ```
   *
   * @example
   * ### Attaching Signatures
   *
   * It is possible to attach a `signature` to the transaction envelope.
   *
   * ```ts twoslash
   * import { Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   maxFeePerGas: Value.fromGwei('10'),
   *   maxPriorityFeePerGas: Value.fromGwei('1'),
   *   to: '0x0000000000000000000000000000000000000000',
   *   value: Value.fromEther('1'),
   * })
   *
   * const signature = Secp256k1.sign({
   *   payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
   *   privateKey: '0x...',
   * })
   *
   * const envelope_signed = TransactionEnvelopeEip1559.from(envelope, { // [!code focus]
   *   signature, // [!code focus]
   * }) // [!code focus]
   * // @log: {
   * // @log:   chainId: 1,
   * // @log:   maxFeePerGas: 10000000000n,
   * // @log:   maxPriorityFeePerGas: 1000000000n,
   * // @log:   to: '0x0000000000000000000000000000000000000000',
   * // @log:   type: 'eip1559',
   * // @log:   value: 1000000000000000000n,
   * // @log:   r: 125...n,
   * // @log:   s: 642...n,
   * // @log:   yParity: 0,
   * // @log: }
   * ```
   *
   * @example
   * ### From Serialized
   *
   * It is possible to instantiate an EIP-1559 Transaction Envelope from a {@link ox#(TransactionEnvelopeEip1559:namespace).Serialized} value.
   *
   * ```ts twoslash
   * import { TransactionEnvelopeEip1559 } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from('0x02f858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261')
   * // @log: {
   * // @log:   chainId: 1,
   * // @log:   maxFeePerGas: 10000000000n,
   * // @log:   maxPriorityFeePerGas: 1000000000n,
   * // @log:   to: '0x0000000000000000000000000000000000000000',
   * // @log:   type: 'eip1559',
   * // @log:   value: 1000000000000000000n,
   * // @log: }
   * ```
   *
   * @param envelope - The transaction object to convert.
   * @param options - Options.
   * @returns An EIP-1559 Transaction Envelope.
   */
  export function from<
    const envelope extends
      | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
      | TransactionEnvelopeEip1559.Serialized,
    const signature extends Signature | undefined = undefined,
  >(
    envelope:
      | envelope
      | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
      | TransactionEnvelopeEip1559.Serialized,
    options: TransactionEnvelopeEip1559.from.Options<signature> = {},
  ): TransactionEnvelopeEip1559.from.ReturnType<envelope, signature> {
    const { signature } = options

    const envelope_ = (
      typeof envelope === 'string'
        ? TransactionEnvelopeEip1559.deserialize(envelope)
        : envelope
    ) as TransactionEnvelopeEip1559

    TransactionEnvelopeEip1559.assert(envelope_)

    return {
      ...envelope_,
      ...(signature ? Signature_from(signature) : {}),
      type: 'eip1559',
    } as never
  }

  export declare namespace from {
    type Options<signature extends Signature | undefined = undefined> = {
      signature?: signature | Signature | undefined
    }

    type ReturnType<
      envelope extends
        | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
        | Hex = TransactionEnvelopeEip1559 | Hex,
      signature extends Signature | undefined = undefined,
    > = Compute<
      envelope extends Hex
        ? TransactionEnvelopeEip1559
        : Assign<
            envelope,
            (signature extends Signature ? Readonly<signature> : {}) & {
              readonly type: 'eip1559'
            }
          >
    >

    type ErrorType =
      | TransactionEnvelopeEip1559.deserialize.ErrorType
      | TransactionEnvelopeEip1559.assert.ErrorType
      | Errors.GlobalErrorType
  }

  from.parseError = (error: unknown) =>
    /* v8 ignore next */
    error as from.ErrorType

  /**
   * Returns the payload to sign for a {@link ox#(TransactionEnvelopeEip1559:type)}.
   *
   * @example
   * The example below demonstrates how to compute the sign payload which can be used
   * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
   *
   * ```ts twoslash
   * import { Secp256k1, TransactionEnvelopeEip1559 } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   nonce: 0n,
   *   maxFeePerGas: 1000000000n,
   *   gas: 21000n,
   *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
   *   value: 1000000000000000000n,
   * })
   *
   * const payload = TransactionEnvelopeEip1559.getSignPayload(envelope) // [!code focus]
   * // @log: '0x...'
   *
   * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
   * ```
   *
   * @param envelope - The transaction envelope to get the sign payload for.
   * @returns The sign payload.
   */
  export function getSignPayload(
    envelope: TransactionEnvelopeEip1559,
  ): TransactionEnvelopeEip1559.getSignPayload.ReturnType {
    return TransactionEnvelopeEip1559.hash(envelope, { presign: true })
  }

  export declare namespace getSignPayload {
    type ReturnType = Hex

    type ErrorType =
      | TransactionEnvelopeEip1559.hash.ErrorType
      | Errors.GlobalErrorType
  }

  getSignPayload.parseError = (error: unknown) =>
    /* v8 ignore next */
    error as getSignPayload.ErrorType

  /**
   * Hashes a {@link ox#(TransactionEnvelopeEip1559:type)}. This is the "transaction hash".
   *
   * @example
   * ```ts twoslash
   * import { Secp256k1, TransactionEnvelopeEip1559 } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   nonce: 0n,
   *   maxFeePerGas: 1000000000n,
   *   gas: 21000n,
   *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
   *   value: 1000000000000000000n,
   * })
   *
   * const signature = Secp256k1.sign({
   *   payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
   *   privateKey: '0x...'
   * })
   *
   * const envelope_signed = TransactionEnvelopeEip1559.from(envelope, { signature })
   *
   * const hash = TransactionEnvelopeEip1559.hash(envelope_signed) // [!code focus]
   * ```
   *
   * @param envelope - The EIP-1559 Transaction Envelope to hash.
   * @param options - Options.
   * @returns The hash of the transaction envelope.
   */
  export function hash<presign extends boolean = false>(
    envelope: TransactionEnvelopeEip1559<presign extends true ? false : true>,
    options: TransactionEnvelopeEip1559.hash.Options<presign> = {},
  ): TransactionEnvelopeEip1559.hash.ReturnType {
    const { presign } = options
    return Hash_keccak256(
      TransactionEnvelopeEip1559.serialize({
        ...envelope,
        ...(presign
          ? {
              r: undefined,
              s: undefined,
              yParity: undefined,
              v: undefined,
            }
          : {}),
      }),
    )
  }

  export declare namespace hash {
    type Options<presign extends boolean = false> = {
      /** Whether to hash this transaction for signing. @default false */
      presign?: presign | boolean | undefined
    }

    type ReturnType = Hex

    type ErrorType =
      | Hash_keccak256.ErrorType
      | TransactionEnvelopeEip1559.serialize.ErrorType
      | Errors.GlobalErrorType
  }

  hash.parseError = (error: unknown) =>
    /* v8 ignore next */
    error as hash.ErrorType

  /**
   * Serializes a {@link ox#(TransactionEnvelopeEip1559:type)}.
   *
   * @example
   * ```ts twoslash
   * import { TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   maxFeePerGas: Value.fromGwei('10'),
   *   maxPriorityFeePerGas: Value.fromGwei('1'),
   *   to: '0x0000000000000000000000000000000000000000',
   *   value: Value.fromEther('1'),
   * })
   *
   * const serialized = TransactionEnvelopeEip1559.serialize(envelope) // [!code focus]
   * ```
   *
   * @example
   * ### Attaching Signatures
   *
   * It is possible to attach a `signature` to the serialized Transaction Envelope.
   *
   * ```ts twoslash
   * import { Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   maxFeePerGas: Value.fromGwei('10'),
   *   maxPriorityFeePerGas: Value.fromGwei('1'),
   *   to: '0x0000000000000000000000000000000000000000',
   *   value: Value.fromEther('1'),
   * })
   *
   * const signature = Secp256k1.sign({
   *   payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
   *   privateKey: '0x...',
   * })
   *
   * const serialized = TransactionEnvelopeEip1559.serialize(envelope, { // [!code focus]
   *   signature, // [!code focus]
   * }) // [!code focus]
   *
   * // ... send `serialized` transaction to JSON-RPC `eth_sendRawTransaction`
   * ```
   *
   * @param envelope - The Transaction Envelope to serialize.
   * @param options - Options.
   * @returns The serialized Transaction Envelope.
   */
  export function serialize(
    envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
    options: TransactionEnvelopeEip1559.serialize.Options = {},
  ): TransactionEnvelopeEip1559.Serialized {
    const {
      chainId,
      gas,
      nonce,
      to,
      value,
      maxFeePerGas,
      maxPriorityFeePerGas,
      accessList,
      data,
      input,
    } = envelope

    TransactionEnvelopeEip1559.assert(envelope)

    const accessTupleList = AccessList_toTupleList(accessList)

    const signature = Signature_extract(options.signature || envelope)

    const serializedTransaction = [
      Hex.fromNumber(chainId),
      nonce ? Hex.fromNumber(nonce) : '0x',
      maxPriorityFeePerGas ? Hex.fromNumber(maxPriorityFeePerGas) : '0x',
      maxFeePerGas ? Hex.fromNumber(maxFeePerGas) : '0x',
      gas ? Hex.fromNumber(gas) : '0x',
      to ?? '0x',
      value ? Hex.fromNumber(value) : '0x',
      data ?? input ?? '0x',
      accessTupleList,
      ...(signature ? Signature_toTuple(signature) : []),
    ]

    return Hex.concat(
      TransactionEnvelopeEip1559.serializedType,
      Rlp_fromHex(serializedTransaction),
    ) as TransactionEnvelopeEip1559.Serialized
  }

  export declare namespace serialize {
    type Options = {
      /** Signature to append to the serialized Transaction Envelope. */
      signature?: Signature | undefined
    }

    type ErrorType =
      | TransactionEnvelopeEip1559.assert.ErrorType
      | Hex.fromNumber.ErrorType
      | Signature_toTuple.ErrorType
      | Hex.concat.ErrorType
      | Rlp_fromHex.ErrorType
      | Errors.GlobalErrorType
  }

  /* v8 ignore next */
  serialize.parseError = (error: unknown) => error as serialize.ErrorType

  /**
   * Converts an {@link ox#(TransactionEnvelopeEip1559:type)} to an {@link ox#(TransactionEnvelopeEip1559:namespace).Rpc}.
   *
   * @example
   * ```ts twoslash
   * import { RpcRequest, TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * const envelope = TransactionEnvelopeEip1559.from({
   *   chainId: 1,
   *   nonce: 0n,
   *   gas: 21000n,
   *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
   *   value: Value.fromEther('1'),
   * })
   *
   * const envelope_rpc = TransactionEnvelopeEip1559.toRpc(envelope) // [!code focus]
   *
   * const request = RpcRequest.from({
   *   id: 0,
   *   method: 'eth_sendTransaction',
   *   params: [envelope_rpc],
   * })
   * ```
   *
   * @param envelope - The EIP-1559 transaction envelope to convert.
   * @returns An RPC-formatted EIP-1559 transaction envelope.
   */
  export function toRpc(
    envelope: Omit<TransactionEnvelopeEip1559, 'type'>,
  ): TransactionEnvelopeEip1559.Rpc {
    const signature = Signature_extract(envelope)

    return {
      ...envelope,
      chainId: Hex.fromNumber(envelope.chainId),
      data: envelope.data ?? envelope.input,
      type: '0x2',
      ...(typeof envelope.gas === 'bigint'
        ? { gas: Hex.fromNumber(envelope.gas) }
        : {}),
      ...(typeof envelope.nonce === 'bigint'
        ? { nonce: Hex.fromNumber(envelope.nonce) }
        : {}),
      ...(typeof envelope.value === 'bigint'
        ? { value: Hex.fromNumber(envelope.value) }
        : {}),
      ...(typeof envelope.maxFeePerGas === 'bigint'
        ? { maxFeePerGas: Hex.fromNumber(envelope.maxFeePerGas) }
        : {}),
      ...(typeof envelope.maxPriorityFeePerGas === 'bigint'
        ? {
            maxPriorityFeePerGas: Hex.fromNumber(envelope.maxPriorityFeePerGas),
          }
        : {}),
      ...(signature ? Signature_toRpc(signature) : {}),
    } as never
  }

  export declare namespace toRpc {
    export type ErrorType = Signature_extract.ErrorType | Errors.GlobalErrorType
  }

  /* v8 ignore next */
  toRpc.parseError = (error: unknown) => error as toRpc.ErrorType

  /**
   * Validates a {@link ox#(TransactionEnvelopeEip1559:type)}. Returns `true` if the envelope is valid, `false` otherwise.
   *
   * @example
   * ```ts twoslash
   * import { TransactionEnvelopeEip1559, Value } from 'ox'
   *
   * const valid = TransactionEnvelopeEip1559.assert({
   *   maxFeePerGas: 2n ** 256n - 1n + 1n,
   *   chainId: 1,
   *   to: '0x0000000000000000000000000000000000000000',
   *   value: Value.fromEther('1'),
   * })
   * // @log: false
   * ```
   *
   * @param envelope - The transaction envelope to validate.
   */
  export function validate(
    envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
  ) {
    try {
      TransactionEnvelopeEip1559.assert(envelope)
      return true
    } catch {
      return false
    }
  }

  export declare namespace validate {
    type ErrorType = Errors.GlobalErrorType
  }

  validate.parseError = (error: unknown) =>
    /* v8 ignore next */
    error as validate.ErrorType

  // #endregion
}
