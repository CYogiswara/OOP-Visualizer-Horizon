import dagre from '@dagrejs/dagre'
import type { ClassInfo, GraphEdge } from './analysis/types'

export const NODE_WIDTH = 180
export const MAX_ROWS = 5
export const NODE_HEIGHT = 60

const HEADER = 52
const ROW = 18
const SECTION = 9

export function nodeHeight(c: ClassInfo): number {
  const rows = (list: unknown[]) => Math.min(list.length, MAX_ROWS) + (list.length > MAX_ROWS ? 1 : 0)
  const propRows = rows(c.properties)
  const methodRows = rows(c.methods)
  const sections = (propRows ? 1 : 0) + (methodRows ? 1 : 0)
  return HEADER + (propRows + methodRows) * ROW + sections * SECTION + 2
}

export function layoutClasses(classes: ClassInfo[], edges: GraphEdge[]){
    const g = new dagre.graphlib.Graph()
    g.setGraph({rankdir: 'TB', nodesep: 50, ranksep: 80})
    g.setDefaultEdgeLabel(() => ({}))

    for(const c of classes){
        g.setNode(c.id, {width: NODE_WIDTH, height: nodeHeight(c)})
    }

    for (const e of edges){
        if(e.kind === 'uses') continue
        if(e.kind === 'extends' || e.kind === 'implements'){
            g.setEdge(e.to, e.from)
        }else if(e.kind === 'has'){
            g.setEdge(e.from, e.to)
        }
    }

    dagre.layout(g)

    const positions = new Map<string, { x: number; y: number }>()
    for (const c of classes) {
        const n = g.node(c.id)
        positions.set(c.id, { x: n.x - NODE_WIDTH/2, y: n.y - nodeHeight(c)/2 })
    }
    return positions
}