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
import { SidePanel } from './components/SidePanel'

const EDGE_STYLE: Record<EdgeKind, { color: string, dash?: string, width: number }> = {
  extends: { color: '#534AB7', width: 2 },
  implements: { color: '#534AB7', width: 2, dash: '7 5' },
  has: { color: '#0F6E56', width: 1.8 },
  uses: { color: '#888780', width: 1.5, dash: '2 5' },
}

const EDGE_LABEL: Record<EdgeKind, string> = {
  extends: 'adalah',
  implements: 'bisa',
  has: 'punya',
  uses: 'pakai',
}

const nodeTypes = { classNode: ClassNode }

function App() {
  const [code, setCode] = useState('')
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [runId, setRunId] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const positions = layoutClasses(classes, edges)

  const connected = new Set<String>()
  const selected = classes.find((c) => c.id === selectedId) ?? null
  if (selectedId) {
    connected.add(selectedId)
    for (const e of edges) {
      if (e.from === selectedId) connected.add(e.to)
      if (e.to === selectedId) connected.add(e.from)
    }
  }

  // Recalculated every render, from the current state
  const flowNodes = classes.map((c) => ({
    id: c.id,
    type: 'classNode',
    position: positions.get(c.id) ?? { x: 0, y: 0 },
    selected: c.id === selectedId,
    data: {
      info: c,
      dimmed: selectedId !== null && !connected.has(c.id)
    }
  }))

  const flowEdges = edges.map((e) => {
    const inherit = e.kind === 'extends' || e.kind === 'implements'
    const st = EDGE_STYLE[e.kind]
    const active = selectedId !== null && (e.from === selectedId || e.to === selectedId)
    const faded = selectedId !== null && !active
    return {
      id: e.id,
      source: e.from,
      target: e.to,
      sourceHandle: inherit ? 't-out' : 'b-out',
      targetHandle: inherit ? 'b-in' : 't-in',
      type: 'smoothstep',
      label: active ? EDGE_LABEL[e.kind] : undefined,
      labelStyle: { fill: st.color, fontWeight: 600, fontSize: 12 },
      labelBgStyle: { fill: '#ffffff' },
      style: {
        stroke: st.color,
        strokeWidth: active ? st.width + 1 : st.width,
        strokeDasharray: st.dash,
        opacity: faded ? 0.12 : 1,
      },
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
    setRunId((r) => r + 1)
    setSelectedId(null)
  }

  return (
    // <>
    //   <textarea value={code} onChange={(e) => setCode(e.target.value)} className='bg-gray-400' />
    //   <button onClick={handleParse} className='bg-indigo-600 text-white px-4 py-2 rounded'>Parse</button>
    //   <div style={{ height: 600, border: '1px solid #ccc' }}>
    //     <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} forceColorMode="light" fitView>
    //       <Background gap={20} />
    //     </ReactFlow>
    //   </div>
    // </>

    <div className='flex min-h-dvh flex-col bg-stone-50 lg:h-dvh'>
      {/* HEADER */}
      <header className='flex flex wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-3'>
        <h1 className='mr-auto text-lg font-semibold'>OOP Visualizer</h1>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Tempel kode Kotlin di sini…"
          className="h-10 w-full rounded border border-stone-300 px-2 py-1 font-mono text-xs sm:w-72"
        />
        <button onClick={handleParse} className='rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700'>Analisis</button>
      </header>

      {/* Graph + panels */}
      <main className='flex flex-1 flex-col lg:min-h0 lg:flex-row'>
        <div className='h-[60vh] lg:h-auto lg:flex-1'>
          <ReactFlow key={runId} nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} forceColorMode="light" onNodeClick={(_, node) => setSelectedId(node.id)} onPaneClick={() => setSelectedId(null)} fitView>
            <Background />
          </ReactFlow>
        </div>

        <aside className="border-t border-stone-200 bg-white p-4 lg:w-[400px] lg:overflow-y-auto lg:border-l lg:border-t-0">
           <SidePanel classes={classes} edges={edges} selected={selected} onSelect={setSelectedId} />
        </aside>
      </main>
    </div>
  )
}

export default App
