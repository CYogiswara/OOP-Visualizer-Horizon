//EXTRACT INFORMATION CLASSES FROM INPUT

import type { ClassInfo, ClassKind, PropertyInfo, TSNode, Visibility } from './types';
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
            properties: constructorProperties(node),
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

function visibilityOf(words: string[]): Visibility {
    if (words.includes('private')) return 'private'
    if (words.includes('protected')) return 'protected'
    if (words.includes('internal')) return 'internal'
    return 'public'
}

function modifierWords(n: TSNode): string[] {
    const mods = child(n, 'modifiers')
    return mods ? mods.children.map((c) => c.text) : []
}

function constructorProperties(classNode: TSNode): PropertyInfo[] {
    const props: PropertyInfo[] = []
    const ctor = child(classNode, 'primary_constructor')
    if (!ctor) return props

    for (const p of ctor.children) {
        if (p.type !== 'class_parameter') continue

        const binding = child(p, 'binding_pattern_kind')
        if (!binding) continue

        const name = child(p, 'simple_identifier')
        if(!name) continue
        const type = child(p, 'user_type') ?? child(p, 'nullable_type')

        props.push({
            name: name.text,
            type: type ? type.text : null,
            mutable: binding.text === 'var',
            visibility: visibilityOf(modifierWords(p)),
            fromConstructor: true,
            isStatic: false,
            typeRefs: [],
            line: p.startPosition.row + 1,
        })
    }
    return props
}