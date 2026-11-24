export interface TSNode{
    type: string
    text:string
    isNamed: boolean
    hasError: boolean
    children: TSNode[]
    startPosition: {row:number, column:number}
    endPosition: {row:number, column:number}
}



export type ClassKind = 'class' | 'open' | 'abstract' | 'interface' | 'data' | 'enum' | 'sealed' | 'object'

export type Visibility = 'public' | 'private' | 'protected' | 'internal'

export interface PropertyInfo {
  name: string
  type: string | null
  typeRefs: string[]
  visibility: Visibility
  mutable: boolean
  fromConstructor: boolean
  isStatic: boolean 
  line: number
}

export interface MethodInfo {
  name: string
  visibility: Visibility
  isOverride: boolean
  isAbstract: boolean
  isOpen: boolean
  isStatic: boolean
  params: { name: string; type: string }[]
  returnType: string | null
  line: number
}

export interface SupertypeRef{
    name: string
    viaConstructor: boolean
}

export interface ClassInfo {
     id: string
  name: string
  kind: ClassKind
  file: string
  startLine: number // 1-based
  endLine: number
  code: string
  properties: PropertyInfo[]
  methods: MethodInfo[]
  supertypes: SupertypeRef[]
  mentionedNames: string[]
  hasMain: boolean
  outer: string | null
}