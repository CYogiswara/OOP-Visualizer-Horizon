import type { ClassInfo, EdgeKind, GraphEdge } from './types'

export function buildEdges(classes: ClassInfo[]): GraphEdge[] {
    const byName = new Map(classes.map((c) => [c.name, c]))
    const edges = new Map<string, GraphEdge>()   // key: "from->to"

    // Adds an edge, unless this pair already has one.
    // Passes run strongest-first, so the first edge for a pair wins.
    const add = (from: string, to: string, kind: EdgeKind, via?: string) => {
        if (from === to) return
        const key = `${from}->${to}`
        const existing = edges.get(key)
        if (existing) {
            // Same pair, same kind (e.g. two properties of type Hewan): remember both names
            if (existing.kind === kind && via) existing.via.push(via)
            return
        }
        edges.set(key, { id: key, from, to, kind, via: via ? [via] : [] })
    }

    // Pass 1: inheritance (strongest)
    for (const c of classes) {
        for (const s of c.supertypes) {
            const target = byName.get(s.name)
            if (!target) continue   // supertype from a library, e.g. AppCompatActivity
            const kind: EdgeKind = target.kind === 'interface' ? 'implements' : 'extends'
            add(c.id, target.id, kind)
        }
    }

    // Pass 2: has-a (property types)
    for (const c of classes) {
        for (const p of c.properties) {
            for (const t of p.typeRefs) {
                const target = byName.get(t)
                if (!target) continue   // String, MutableList, ... aren't uploaded classes
                add(c.id, target.id, 'has', p.name)
            }
        }
    }

    // Pass 3: uses (any other mention)
    for (const c of classes) {
        for (const name of c.mentionedNames) {
            const target = byName.get(name)
            if (!target) continue
            add(c.id, target.id, 'uses')
        }
    }

    return [...edges.values()]
}