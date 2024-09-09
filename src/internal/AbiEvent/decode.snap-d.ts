import { attest } from '@ark/attest'
import { AbiEvent } from 'ox'
import { test } from 'vitest'
import { seaportContractConfig } from '../../../test/constants/abis.js'

test('behavior: named', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  attest(decoded).type.toString.snap(`{
  from: \`0x\${string}\`
  to: \`0x\${string}\`
  value: bigint
}`)
})

test('behavior: unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed, address indexed, uint256)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  attest(decoded).type.toString.snap(
    'readonly [`0x${string}`, `0x${string}`, bigint]',
  )
})

test('behavior: named + unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  attest(decoded).type.toString.snap(`{
  from: \`0x\${string}\`
  to: \`0x\${string}\`
  2: bigint
}`)
})

test('behavior: named + unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed, uint256 value)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  attest(decoded).type.toString.snap(`{
  from: \`0x\${string}\`
  1: \`0x\${string}\`
  value: bigint
}`)
})

test('behavior: named + unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed, uint256 value, uint256)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0x9ed053bb818ff08b8353cd46f78db1f0799f31c9e4458fdb425c10eccd2efc44',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  attest(decoded).type.toString.snap(`{
  from: \`0x\${string}\`
  1: \`0x\${string}\`
  value: bigint
  3: bigint
}`)
})

test('behavior: string inputs', () => {
  const transfer = AbiEvent.from('event Transfer(string indexed a)')

  const decoded = AbiEvent.decode(transfer, {
    topics: [
      '0x7cebee4ee226a36ff8751d9d69bb8265f5138c825f8c25d7ebdd60d972ffe5be',
      '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
    ],
  })

  attest(decoded).type.toString.snap('{ a: string }')
})

test('behavior: widened event', () => {
  const transfer = AbiEvent.from('event Transfer(string indexed a)')

  const decoded = AbiEvent.decode(transfer as AbiEvent.AbiEvent, {
    topics: [
      '0x7cebee4ee226a36ff8751d9d69bb8265f5138c825f8c25d7ebdd60d972ffe5be',
      '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
    ],
  })

  attest(decoded).type.toString.snap('unknown')
})

test('behavior: union event', () => {
  const transfer = AbiEvent.fromAbi(seaportContractConfig.abi, {
    name: 'CounterIncremented' as AbiEvent.Name<
      typeof seaportContractConfig.abi
    >,
  })

  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
    topics: [
      '0x721c20121297512b72821b97f5326877ea8ecf4bb9948fea5bfcb6453074d37f',
      '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
    ],
  })

  attest(decoded).type.toString.snap(`  | { newCounter: bigint; offerer: \`0x\${string}\` }
  | {
      orderHash: \`0x\${string}\`
      offerer: \`0x\${string}\`
      zone: \`0x\${string}\`
    }
  | {
      orderHash: \`0x\${string}\`
      offerer: \`0x\${string}\`
      zone: \`0x\${string}\`
      recipient: \`0x\${string}\`
      offer: readonly {
        itemType: number
        token: \`0x\${string}\`
        identifier: bigint
        amount: bigint
      }[]
      consideration: readonly {
        itemType: number
        token: \`0x\${string}\`
        identifier: bigint
        amount: bigint
        recipient: \`0x\${string}\`
      }[]
    }
  | {
      orderHash: \`0x\${string}\`
      offerer: \`0x\${string}\`
      zone: \`0x\${string}\`
    }`)
})
