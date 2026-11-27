import { useState } from 'react'
import { getKotlinParser } from './parser'
import { extractClasses } from './analysis/extract'
import { buildEdges } from './analysis/graph'
import type { ClassInfo, GraphEdge } from './analysis/types'
import { ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutClasses } from './layout'
import { ClassNode } from './components/ClassNode'
import { MarkerType } from '@xyflow/react'
import type { EdgeKind } from './analysis/types'
import { Background } from '@xyflow/react'

const EDGE_STYLE: Record<EdgeKind, { color: string, dash?: string, width: number }> = {
  extends: { color: '#534AB7', width: 2 },
  implements: { color: '#534AB7', width: 2, dash: '7 5' },
  has: { color: '#0F6E56', width: 1.8 },
  uses: { color: '#888780', width: 1.5, dash: '2 5' },
}

const nodeTypes = { classNode: ClassNode }

function App() {
  const [code, setCode] = useState('')
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])

  const positions = layoutClasses(classes, edges)
  // Recalculated every render, from the current state
  const flowNodes = classes.map((c) => ({
    id: c.id,
    type: 'classNode',
    position: positions.get(c.id) ?? { x: 0, y: 0 },
    data: { info: c }
  }))

  const flowEdges = edges.map((e) => {
    const inherit = e.kind === 'extends' || e.kind === 'implements'
    const st = EDGE_STYLE[e.kind]
    return {
      id: e.id,
      source: e.from,
      target: e.to,
      sourceHandle: inherit ? 't-out' : 'b-out',
      targetHandle: inherit ? 'b-in' : 't-in',
      type: 'smoothstep',
      style: { stroke: st.color, strokeWidth: st.width, strokeDasharray: st.dash },
      markerEnd: {
        type: inherit ? MarkerType.ArrowClosed : MarkerType.Arrow,
        color: st.color,
        width: 18,
        height: 18,
      }
    }
  })

  const handleParse = async () => {
    const parser = await getKotlinParser()
    const tree = parser.parse(code)

    const found = extractClasses(tree.rootNode, 'Test.kt', code)
    const foundEdges = buildEdges(found)

    // Log the local values: these are the fresh results
    console.log('Extracted classes:', found)
    console.log(foundEdges.map((e) => `${e.from} -${e.kind}-> ${e.to} ${e.via.join(',')}`).join('\n'))

    // Save to state, which triggers a re-render, which redraws the graph
    setClasses(found)
    setEdges(foundEdges)
  }

  return (
    <>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} className='bg-gray-400' />
      <button onClick={handleParse} className='bg-indigo-600 text-white px-4 py-2 rounded'>Parse</button>
      <div style={{ height: 600, border: '1px solid #ccc' }}>
        <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} forceColorMode="light" fitView>
          <Background gap={20} />
        </ReactFlow>
      </div>
    </>
  )
}

export default App
