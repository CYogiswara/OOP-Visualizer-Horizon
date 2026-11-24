//EXTRACT INFORMATION CLASSES FROM INPUT

import type { ClassInfo, ClassKind, TSNode } from './types';
const child = (n: TSNode, type: string) =>
    n.children.find((c) => c.type === type)

export function extractClasses(root: TSNode, file: string, content: string): ClassInfo[] {
    const result: ClassInfo[] = []

    const lines = content.split('\n')

    for (const node of root.children) {
        if (node.type !== 'class_declaration' && node.type !== 'object_declaration') {
            continue
        }

        const startLine = node.startPosition.row + 1
        const endLine = node.endPosition.row + 1
        const code = lines.slice(startLine - 1, endLine).join('\n')

        const nameNode = child(node, 'type_identifier')

        if (!nameNode) continue

        result.push({
            id: nameNode.text,
            name: nameNode.text,
            file: file,
            startLine: startLine,
            endLine: endLine,
            code: code,
            kind: kindOf(node),
            properties: [],
            methods: [],
            supertypes: [],
            mentionedNames: [],
            hasMain: false,
            outer: null
        })
    }
    return result
}

function kindOf(n: TSNode,): ClassKind {
    if (n.type === 'object_declaration') return 'object'
    if (n.children.some(c => c.type === 'interface')) return 'interface'
    const mods = child(n, 'modifiers')
    const words = mods ? mods.children.map(c => c.text) : []
    if (words.includes('enum')) return 'enum'
    if (words.includes('data')) return 'data'
    if (words.includes('sealed')) return 'sealed'
    if (words.includes('abstract')) return 'abstract'
    if (words.includes('open')) return 'open'
    return 'class'
}