import { useState } from 'react'
import './App.css'
import { getKotlinParser } from './parser'
import { extractClasses } from './analysis/extract'

function App() {
  const [code, setCode] = useState('')

  return (
    <>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} /> 
        <button onClick={async () => {
            const parser = await getKotlinParser()
            const tree = parser.parse(code)
            console.log('Parsed code:', tree.rootNode.toString())  
            extractClasses(tree.rootNode, 'Test.kt', code)
            console.log("Extracted classes: ", extractClasses(tree.rootNode, 'Test.kt', code))
        }}>Parse</button>
    </>
  )
}

export default App
