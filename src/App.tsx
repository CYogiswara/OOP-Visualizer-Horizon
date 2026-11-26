import { useState } from 'react'
import { getKotlinParser } from './parser'
import { extractClasses } from './analysis/extract'
import { buildEdges } from './analysis/graph'
import type { ClassInfo, GraphEdge } from './analysis/types'
import { ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

function App() {
  const [code, setCode] = useState('')
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])

  // Recalculated every render, from the current state
  const flowNodes = classes.map((c, i) => ({
    id: c.id,
    position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 120 },
    data: { label: c.name },
  }))

  const flowEdges = edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
  }))

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
      <textarea value={code} onChange={(e) => setCode(e.target.value)} className='bg-gray-400'/>
      <button onClick={handleParse} className='bg-indigo-600 text-white px-4 py-2 rounded'>Parse</button>
      <div style={{ height: 600, border: '1px solid #ccc' }}>
        <ReactFlow nodes={flowNodes} edges={flowEdges} fitView />
      </div>
    </>
  )
}

export default App
