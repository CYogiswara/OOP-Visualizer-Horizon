import { useState } from 'react'
import './App.css'
import { getKotlinParser } from './parser'
import { extractClasses } from './analysis/extract'
import { buildEdges } from './analysis/graph'

function App() {
  const [code, setCode] = useState('')
  

  return (
    <>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <button onClick={async () => {
        const parser = await getKotlinParser()
        const tree = parser.parse(code)
        console.log('Parsed code:', tree.rootNode.toString())

        const classes = extractClasses(tree.rootNode, 'Test.kt', code)
        console.log("Extracted class: ", classes)

        const edges = buildEdges(classes)
        console.log(edges.map((e) => `${e.from} - ${e.kind} -> ${e.to} ${e.via.join(',')}`).join())        
      }}>Parse</button>
    </>
  )
}

export default App
