import { resolve } from 'node:path'
import * as tsdoc from '@microsoft/tsdoc'
import { TSDocConfigFile } from '@microsoft/tsdoc-config'
import { Project, ScriptTarget, SyntaxKind } from 'ts-morph'

import type { ResolveDeclarationReference } from './model.js'

export function extractNamespaceDocComments(file: string) {
  const project = new Project({
    compilerOptions: {
      target: ScriptTarget.ESNext,
    },
  })
  const entrypointAst = project.addSourceFileAtPath(file)

  const configFile = TSDocConfigFile.loadFile(
    resolve(import.meta.dirname, '../../../tsdoc.json'),
  )

  const tsdocConfiguration = new tsdoc.TSDocConfiguration()
  configFile.configureParser(tsdocConfiguration)
  const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser(
    tsdocConfiguration,
  )

  const nodes = entrypointAst.getDescendantsOfKind(SyntaxKind.ExportDeclaration)

  const docComments: Record<string, ReturnType<typeof processDocComment>> = {}
  for (const node of nodes) {
    const namespace = node
      .getDescendantsOfKind(SyntaxKind.NamespaceExport)[0]
      ?.getDescendantsOfKind(SyntaxKind.Identifier)[0]
      ?.getText()
    if (!namespace) continue

    const tsDoc = node.getDescendantsOfKind(SyntaxKind.JSDoc)[0]?.getText()
    if (!tsDoc) continue

    const parserContext: tsdoc.ParserContext = tsdocParser.parseString(tsDoc)
    const docComment = processDocComment(parserContext.docComment)
    if (!docComment) continue

    docComments[namespace] = docComment
  }
  return docComments
}

export function processDocComment(
  docComment?: tsdoc.DocComment | undefined,
  resolveDeclarationReference?: ResolveDeclarationReference,
) {
  if (!docComment) return

  return {
    alias: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@alias'),
        resolveDeclarationReference,
      ),
      '@alias',
    ),
    alpha: docComment.modifierTagSet.isAlpha(),
    beta: docComment.modifierTagSet.isBeta(),
    category: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@category'),
        resolveDeclarationReference,
      ),
      '@category',
    ),
    comment: docComment?.emitAsTsdoc(),
    default: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@default'),
        resolveDeclarationReference,
      ),
      '@default',
    ),
    deprecated: cleanDoc(
      renderDocNode(docComment?.deprecatedBlock, resolveDeclarationReference),
      '@deprecated',
    ),
    docGroup: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@docGroup'),
        resolveDeclarationReference,
      ),
      '@docGroup',
    ),
    examples: docComment?.customBlocks
      .filter((v) => v.blockTag.tagName === '@example')
      .map((v) => renderDocNode(v, resolveDeclarationReference))
      .map((example) => cleanDoc(example, '@example')),
    experimental: docComment.modifierTagSet.isExperimental(),
    remarks: cleanDoc(
      renderDocNode(docComment?.remarksBlock, resolveDeclarationReference),
      '@remarks',
    ),
    returns: cleanDoc(
      renderDocNode(docComment?.returnsBlock, resolveDeclarationReference),
      '@returns',
    ),
    since: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@since'),
        resolveDeclarationReference,
      ),
      '@since',
    ),
    summary: cleanDoc(
      renderDocNode(docComment?.summarySection, resolveDeclarationReference),
    ),
    throws: docComment?.customBlocks
      .filter((v) => v.blockTag.tagName === '@throws')
      .map((v) => renderDocNode(v, resolveDeclarationReference))
      .map((throws) => cleanDoc(throws, '@throws')),
  }
}

export function cleanDoc(docString: string, removeTag?: undefined | string) {
  if (removeTag)
    return docString.replace(new RegExp(`^\\s*${removeTag}`, 'g'), '').trim()
  return docString.trim()
}

export function renderDocNode(
  node?: tsdoc.DocNode | ReadonlyArray<tsdoc.DocNode> | undefined,
  resolveDeclarationReference?: ResolveDeclarationReference,
): string {
  if (!node) return ''
  if (Array.isArray(node))
    return node
      .map((node) => renderDocNode(node, resolveDeclarationReference))
      .join('')

  const docNode = node as tsdoc.DocNode

  let result = ''
  if (docNode) {
    if (docNode instanceof tsdoc.DocFencedCode) {
      let code = docNode.code.toString()
      let meta = ''
      code = code.replace(
        /^\s*\/\/\s*codeblock-meta(\s.*?)$\n?/gm,
        (_line, metaMatch) => {
          meta += metaMatch
          return ''
        },
      )
      return `\`\`\`${docNode.language}${meta}\n${code}\`\`\``
    }
    if (docNode instanceof tsdoc.DocExcerpt)
      result += docNode.content.toString()

    if (docNode instanceof tsdoc.DocLinkTag) {
      const destination = docNode.codeDestination
      if (destination) {
        const result = resolveDeclarationReference?.(destination)
        if (result) return `[\`${result.text}\`](${result.url})`
      }
      // TODO: Render plain {@link}
      // return `[${docNode.linkText}](${docNode.urlDestination})`
    }

    for (const childNode of docNode.getChildNodes())
      result += renderDocNode(childNode, resolveDeclarationReference)
  }

  return result
}
