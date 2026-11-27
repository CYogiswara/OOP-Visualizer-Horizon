import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { ClassInfo, ClassKind, Visibility } from '../analysis/types'
import { MAX_ROWS, NODE_WIDTH } from '../layout'

export type ClassNodeData = {
    info: ClassInfo
    issueCount?: number // filled by the health check later
    dimmed?: boolean    // filled by selection highlighting later
}
export type ClassNodeType = Node<ClassNodeData, 'classNode'>

// Full class strings (not built dynamically) so Tailwind can find them
const KIND_STYLE: Record<ClassKind, { label: string; header: string; badge: string }> = {
    class: { label: 'class', header: 'bg-stone-100 text-stone-800', badge: 'border-stone-400 text-stone-700' },
    open: { label: 'open class', header: 'bg-sky-50 text-sky-900', badge: 'border-sky-400 text-sky-800' },
    abstract: { label: 'abstract class', header: 'bg-indigo-50 text-indigo-900', badge: 'border-indigo-300 text-indigo-800' },
    interface: { label: 'interface', header: 'bg-pink-50 text-pink-900', badge: 'border-pink-300 text-pink-800' },
    data: { label: 'data class', header: 'bg-teal-50 text-teal-900', badge: 'border-teal-400 text-teal-800' },
    enum: { label: 'enum class', header: 'bg-lime-50 text-lime-900', badge: 'border-lime-400 text-lime-800' },
    sealed: { label: 'sealed class', header: 'bg-orange-50 text-orange-900', badge: 'border-orange-300 text-orange-800' },
    object: { label: 'object', header: 'bg-amber-50 text-amber-900', badge: 'border-amber-400 text-amber-800' },
}

const VIS: Record<Visibility, { symbol: string; color: string }> = {
    public: { symbol: '+', color: 'text-green-700' },
    private: { symbol: '−', color: 'text-red-700' },
    protected: { symbol: '#', color: 'text-amber-700' },
    internal: { symbol: '~', color: 'text-blue-700' },
}

// Hidden connection points; arrows still attach to them
const handleStyle = { opacity: 0 }

export function ClassNode({ data, selected }: NodeProps<ClassNodeType>) {
    const { info, issueCount = 0, dimmed = false } = data
    const kind = KIND_STYLE[info.kind]
    const props = info.properties.slice(0, MAX_ROWS)
    const methods = info.methods.slice(0, MAX_ROWS)

    return (
        <div
            className={`rounded-lg border bg-white text-xs shadow-sm transition-opacity
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-stone-300'}
        ${dimmed ? 'opacity-25' : ''}`}
            style={{ width: NODE_WIDTH }}
        >
            {/* Inheritance: child's top (t-out) → parent's bottom (b-in).
          Has/uses: owner's bottom (b-out) → part's top (t-in). */}
            <Handle type="target" position={Position.Top} id="t-in" style={{ ...handleStyle, left: '35%' }} />
            <Handle type="source" position={Position.Top} id="t-out" style={{ ...handleStyle, left: '65%' }} />
            <Handle type="target" position={Position.Bottom} id="b-in" style={{ ...handleStyle, left: '65%' }} />
            <Handle type="source" position={Position.Bottom} id="b-out" style={{ ...handleStyle, left: '35%' }} />

            {/* Header: fixed height so nodeHeight() can predict it */}
            <div className={`relative h-[52px] rounded-t-lg border-b border-stone-200 px-2.5 py-1.5 ${kind.header}`}>
                <span className={`inline-block rounded-full border bg-white px-2 text-[11px] leading-4 ${kind.badge}`}>
                    {kind.label}
                </span>
                {issueCount > 0 && (
                    <span className="absolute right-2 top-1.5 rounded-full border border-amber-400 bg-amber-50 px-1.5 text-[11px] text-amber-800">
                        ⚠ {issueCount}
                    </span>
                )}
                <div className="mt-0.5 truncate text-sm font-semibold">{info.name}</div>
            </div>

            {props.length > 0 && (
                <ul className="border-b border-stone-200 px-2.5 py-1 last:border-b-0">
                    {props.map((p) => (
                        <li key={p.name} className="flex h-[18px] items-center gap-1.5 overflow-hidden whitespace-nowrap font-mono text-[11px]">
                            <span className={`w-2.5 font-bold ${VIS[p.visibility].color}`}>{VIS[p.visibility].symbol}</span>
                            <span className="truncate">
                                {p.mutable ? 'var' : 'val'} {p.name}
                                {p.type && <span className="text-stone-500">: {p.type}</span>}
                            </span>
                        </li>
                    ))}
                    {info.properties.length > MAX_ROWS && (
                        <li className="h-[18px] text-[11px] text-stone-500">+{info.properties.length - MAX_ROWS} properti lagi</li>
                    )}
                </ul>
            )}

            {methods.length > 0 && (
                <ul className="px-2.5 py-1">
                    {methods.map((m, i) => (
                        <li key={`${m.name}-${i}`} className="flex h-[18px] items-center gap-1.5 overflow-hidden whitespace-nowrap font-mono text-[11px]">
                            <span className={`w-2.5 font-bold ${VIS[m.visibility].color}`}>{VIS[m.visibility].symbol}</span>
                            <span className="truncate">{m.name}()</span>
                            {m.isOverride && <span className="rounded-full bg-indigo-50 px-1.5 font-sans text-[10px] text-indigo-800">override</span>}
                            {m.isAbstract && <span className="rounded-full bg-pink-50 px-1.5 font-sans text-[10px] text-pink-800">abstract</span>}
                        </li>
                    ))}
                    {info.methods.length > MAX_ROWS && (
                        <li className="h-[18px] text-[11px] text-stone-500">+{info.methods.length - MAX_ROWS} method lagi</li>
                    )}
                </ul>
            )}
        </div>
    )
}