import { EDGE_INFO, KIND_INFO, VISIBILITY_INFO, describeRelations, librarySupertypes } from '../analysis/explain'
import type { ClassInfo, EdgeKind, GraphEdge } from '../analysis/types'
import type { ReactNode } from 'react'

interface Props {
  classes: ClassInfo[]
  edges: GraphEdge[]
  selected: ClassInfo | null
  onSelect: (id: string) => void
}

// Left-border and label color per relationship kind (matches the arrow colors)
const REL_STYLE: Record<EdgeKind, string> = {
  extends: 'border-indigo-600 text-indigo-700',
  implements: 'border-indigo-400 border-dashed text-indigo-700',
  has: 'border-emerald-700 text-emerald-800',
  uses: 'border-stone-400 border-dotted text-stone-600',
}

const VIS_COLOR = { public: 'text-green-700', private: 'text-red-700', protected: 'text-amber-700', internal: 'text-blue-700' }

export function SidePanel({ classes, edges, selected, onSelect }: Props) {
  if (classes.length === 0) {
    return <p className="text-sm text-stone-500">Tempel kode Kotlin lalu klik "Analisis".</p>
  }
  return selected
    ? <ClassDetail c={selected} classes={classes} edges={edges} onSelect={onSelect} />
    : <Overview classes={classes} edges={edges} />
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-stone-500">{children}</h3>
}

function Overview({ classes, edges }: { classes: ClassInfo[]; edges: GraphEdge[] }) {
  const files = new Set(classes.map((c) => c.file)).size
  return (
    <div>
      <p className="text-sm text-stone-600">Klik sebuah kelas di graf untuk melihat penjelasan, hubungan, dan kodenya.</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[[files, 'file'], [classes.length, 'kelas'], [edges.length, 'hubungan']].map(([n, label]) => (
          <div key={label} className="rounded-lg border border-stone-200 p-2">
            <div className="text-2xl font-semibold">{n}</div>
            <div className="text-xs text-stone-500">{label}</div>
          </div>
        ))}
      </div>

      <SectionTitle>Cara membaca panah</SectionTitle>
      <ul className="space-y-2">
        {(Object.keys(EDGE_INFO) as EdgeKind[]).map((k) => (
          <li key={k} className={`border-l-[3px] pl-2.5 text-sm ${REL_STYLE[k]}`}>
            <span className="font-semibold">{EDGE_INFO[k].label}</span>
            <span className="block text-stone-700">{EDGE_INFO[k].explain}</span>
          </li>
        ))}
      </ul>

      <SectionTitle>Simbol akses</SectionTitle>
      <ul className="space-y-1 text-sm">
        {Object.entries(VISIBILITY_INFO).map(([v, info]) => (
          <li key={v}>
            <span className={`mr-2 font-mono font-bold ${VIS_COLOR[v as keyof typeof VIS_COLOR]}`}>{info.symbol}</span>
            {info.explain}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ClassDetail({ c, classes, edges, onSelect }: { c: ClassInfo; classes: ClassInfo[]; edges: GraphEdge[]; onSelect: (id: string) => void }) {
  const { outgoing, incoming } = describeRelations(c, classes, edges)
  const libs = librarySupertypes(c, classes)
  const lines = c.code.split('\n')

  return (
    <div>
      {/* Header */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
        <span className="rounded-full border border-indigo-300 bg-white px-2 text-[11px] text-indigo-800">{KIND_INFO[c.kind].label}</span>
        <h2 className="mt-1 text-2xl font-semibold">{c.name}</h2>
        <p className="text-xs text-stone-500">{c.file} · baris {c.startLine}–{c.endLine}</p>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{KIND_INFO[c.kind].explain}</p>

      {/* Relationships */}
      {(outgoing.length > 0 || incoming.length > 0 || libs.length > 0) && (
        <>
          <SectionTitle>Hubungan</SectionTitle>
          <ul className="space-y-2">
            {libs.map((l) => (
              <li key={l} className="border-l-[3px] border-stone-300 pl-2.5 text-sm">
                <span className="block text-[11px] font-semibold uppercase text-stone-500">library</span>
                {c.name} mewarisi {l} dari library luar (misalnya Android). Kodenya tidak ada di file yang diunggah.
              </li>
            ))}
            {outgoing.map((r) => (
              <li key={r.edge.id} className={`border-l-[3px] pl-2.5 text-sm ${REL_STYLE[r.edge.kind]}`}>
                <span className="block text-[11px] font-semibold uppercase">{EDGE_INFO[r.edge.kind].label}</span>
                <button onClick={() => onSelect(r.otherId)} className="text-left text-stone-800 hover:text-indigo-700 hover:underline">
                  {r.sentence}
                </button>
              </li>
            ))}
            {incoming.map((r) => (
              <li key={r.edge.id} className="border-l-[3px] border-dotted border-stone-300 pl-2.5 text-sm">
                <span className="block text-[11px] font-semibold uppercase text-stone-500">Dipakai oleh</span>
                <button onClick={() => onSelect(r.otherId)} className="text-left text-stone-800 hover:text-indigo-700 hover:underline">
                  {r.sentence}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Properties */}
      {c.properties.length > 0 && (
        <>
          <SectionTitle>Properti ({c.properties.length})</SectionTitle>
          <ul className="divide-y divide-stone-100">
            {c.properties.map((p) => (
              <li key={p.name} title={VISIBILITY_INFO[p.visibility].explain} className="flex flex-wrap items-center gap-x-2 py-1.5 text-sm">
                <span className={`font-mono font-bold ${VIS_COLOR[p.visibility]}`}>{VISIBILITY_INFO[p.visibility].symbol}</span>
                <code className="font-mono text-[13px]">
                  {p.visibility !== 'public' && `${p.visibility} `}{p.mutable ? 'var' : 'val'} {p.name}{p.type && `: ${p.type}`}
                </code>
                {p.fromConstructor && <span className="rounded-full bg-stone-100 px-2 text-[11px] text-stone-600">konstruktor</span>}
                {p.mutable && <span className="rounded-full bg-amber-50 px-2 text-[11px] text-amber-800">bisa diubah</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Methods */}
      {c.methods.length > 0 && (
        <>
          <SectionTitle>Method ({c.methods.length})</SectionTitle>
          <ul className="divide-y divide-stone-100">
            {c.methods.map((m, i) => (
              <li key={`${m.name}-${i}`} title={VISIBILITY_INFO[m.visibility].explain} className="flex flex-wrap items-center gap-x-2 py-1.5 text-sm">
                <span className={`font-mono font-bold ${VIS_COLOR[m.visibility]}`}>{VISIBILITY_INFO[m.visibility].symbol}</span>
                <code className="font-mono text-[13px]">
                  {m.name}({m.params.map((p) => `${p.name}: ${p.type}`).join(', ')}){m.returnType && `: ${m.returnType}`}
                </code>
                {m.isOverride && <span className="rounded-full bg-indigo-50 px-2 text-[11px] text-indigo-800">override</span>}
                {m.isAbstract && <span className="rounded-full bg-pink-50 px-2 text-[11px] text-pink-800">abstract</span>}
                {m.isOpen && <span className="rounded-full bg-sky-50 px-2 text-[11px] text-sky-800">open</span>}
              </li>
            ))}
          </ul>
          {c.methods.some((m) => m.isOverride) && (
            <p className="mt-2 rounded-lg bg-indigo-50 p-2.5 text-[13px] leading-relaxed">
              Method bertanda <b>override</b> adalah contoh <b>polimorfisme</b>: namanya sama dengan milik induk/interface,
              tetapi perilakunya khusus untuk {c.name}.
            </p>
          )}
        </>
      )}

      {/* Source code */}
      <SectionTitle>Kode</SectionTitle>
      <pre className="overflow-x-auto rounded-lg bg-[#1f1e2e] py-2.5 font-mono text-xs leading-relaxed text-[#e8e6f5]">
        {lines.map((l, i) => (
          <div key={i} className="flex whitespace-pre pr-3">
            <span className="w-10 shrink-0 select-none pr-3 text-right text-[#6f6c8c]">{c.startLine + i}</span>
            <span>{l || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}