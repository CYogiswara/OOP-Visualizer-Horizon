import Parser from 'web-tree-sitter'

let parserPromise: Promise<Parser> | null = null

export function getKotlinParser(): Promise<Parser> {
    if(!parserPromise) {
        parserPromise = (async () => {
            const base = import.meta.env.BASE_URL
            await Parser.init({locateFile: (file: string) => `${base}${file}`})
            const kotlin = await Parser.Language.load(`${base}tree-sitter-kotlin.wasm`)
            const parser = new Parser()
            parser.setLanguage(kotlin)
            return parser
        })().catch((err) => {
            parserPromise = null
            throw err
        })
    }
    return parserPromise
}