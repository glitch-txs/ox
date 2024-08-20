import type { TypedData } from 'abitype'
import type { GlobalErrorType } from '../errors/error.js'

export function encodeType(value: encodeType.Value): encodeType.ReturnType {
  const { primaryType, types } = value

  let result = ''
  const unsortedDeps = findTypeDependencies({ primaryType, types })
  unsortedDeps.delete(primaryType)

  const deps = [primaryType, ...Array.from(unsortedDeps).sort()]
  for (const type of deps) {
    result += `${type}(${(types[type] ?? [])
      .map(({ name, type: t }) => `${t} ${name}`)
      .join(',')})`
  }

  return result
}

export declare namespace encodeType {
  type Value = {
    primaryType: string
    types: TypedData
  }

  type ReturnType = string

  type ErrorType = findTypeDependencies.ErrorType | GlobalErrorType
}

function findTypeDependencies(
  value: {
    primaryType: string
    types: TypedData
  },
  results: Set<string> = new Set(),
): Set<string> {
  const { primaryType: primaryType_, types } = value
  const match = primaryType_.match(/^\w*/u)
  const primaryType = match?.[0]!
  if (results.has(primaryType) || types[primaryType] === undefined)
    return results

  results.add(primaryType)

  for (const field of types[primaryType])
    findTypeDependencies({ primaryType: field.type, types }, results)
  return results
}

declare namespace findTypeDependencies {
  type ErrorType = GlobalErrorType
}
