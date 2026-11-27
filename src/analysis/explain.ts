import type { ClassInfo, ClassKind, EdgeKind, GraphEdge, Visibility } from './types'

export const KIND_INFO: Record<ClassKind, { label: string; explain: string }> = {
  class: {
    label: 'class',
    explain: 'Kelas biasa: cetakan untuk membuat objek. Di Kotlin, kelas bersifat final secara default, jadi tidak bisa diwarisi kecuali ditandai "open".',
  },
  open: {
    label: 'open class',
    explain: 'Kelas yang boleh diwarisi. Kotlin mewajibkan kata "open" agar pewarisan selalu disengaja.',
  },
  abstract: {
    label: 'abstract class',
    explain: 'Kelas abstrak tidak bisa dibuat objeknya langsung. Ia menjadi "kerangka" bersama, dan method abstract-nya wajib diisi oleh kelas turunan.',
  },
  interface: {
    label: 'interface',
    explain: 'Interface adalah kontrak: daftar kemampuan yang wajib disediakan oleh kelas yang mengimplementasikannya. Satu kelas boleh mengimplementasikan banyak interface.',
  },
  data: {
    label: 'data class',
    explain: 'Data class khusus untuk menyimpan data. Kotlin otomatis membuatkan equals(), hashCode(), toString(), dan copy().',
  },
  enum: {
    label: 'enum class',
    explain: 'Enum berisi daftar nilai tetap yang sudah ditentukan, misalnya status atau jenis.',
  },
  sealed: {
    label: 'sealed class',
    explain: 'Sealed class membatasi turunannya hanya pada yang ditulis di file/package yang sama, sehingga "when" bisa mengecek semua kemungkinan.',
  },
  object: {
    label: 'object',
    explain: 'Object adalah singleton: hanya ada satu objek untuk seluruh program, dan dipakai langsung lewat namanya tanpa "()".',
  },
}

export const EDGE_INFO: Record<EdgeKind, { label: string; explain: string }> = {
  extends: { label: 'Mewarisi', explain: 'Pewarisan ("adalah"): kelas anak mendapat properti dan method kelas induk.' },
  implements: { label: 'Mengimplementasikan', explain: 'Implementasi interface ("bisa"): kelas berjanji menyediakan method dari interface.' },
  has: { label: 'Memiliki', explain: 'Komposisi ("punya"): kelas menyimpan objek kelas lain sebagai properti.' },
  uses: { label: 'Memakai', explain: 'Ketergantungan ("pakai"): kelas memakai kelas lain di dalam method, parameter, atau saat membuat objek.' },
}

export const VISIBILITY_INFO: Record<Visibility, { symbol: string; explain: string }> = {
  public: { symbol: '+', explain: 'public: bisa diakses dari mana saja' },
  private: { symbol: '−', explain: 'private: hanya bisa diakses di dalam kelas ini' },
  protected: { symbol: '#', explain: 'protected: hanya kelas ini dan turunannya' },
  internal: { symbol: '~', explain: 'internal: hanya di dalam modul yang sama' },
}

export interface Relation {
  edge: GraphEdge
  otherId: string
  sentence: string
}

/** Plain-language sentences describing how a class relates to the others. */
export function describeRelations(c: ClassInfo, classes: ClassInfo[], edges: GraphEdge[]) {
  const byId = new Map(classes.map((k) => [k.id, k]))
  const nameOf = (id: string) => byId.get(id)?.name ?? id

  // Arrows leaving this class: what it extends, implements, has, uses
  const outgoing: Relation[] = edges
    .filter((e) => e.from === c.id)
    .map((e) => {
      const o = nameOf(e.to)
      let sentence = ''
      if (e.kind === 'extends') sentence = `${c.name} adalah ${o}, jadi ${c.name} mewarisi semua properti dan method ${o} yang tidak private.`
      if (e.kind === 'implements') {
        const fns = byId.get(e.to)?.methods.map((m) => `${m.name}()`).join(', ')
        sentence = `${c.name} bisa ${o}: ia berjanji menyediakan ${fns || 'method dari interface ini'}.`
      }
      if (e.kind === 'has') sentence = `${c.name} memiliki ${o} lewat properti ${e.via.join(', ')}.`
      if (e.kind === 'uses') sentence = `${c.name} memakai ${o} di dalam kodenya (parameter, nilai kembali, atau membuat objek).`
      return { edge: e, otherId: e.to, sentence }
    })

  // Arrows arriving at this class: who extends, has or uses it
  const incoming: Relation[] = edges
    .filter((e) => e.to === c.id)
    .map((e) => {
      const o = nameOf(e.from)
      const sentences: Record<EdgeKind, string> = {
        extends: `${o} mewarisi ${c.name}.`,
        implements: `${o} mengimplementasikan ${c.name}.`,
        has: `${o} memiliki ${c.name} (properti ${e.via.join(', ')}).`,
        uses: `${o} memakai ${c.name}.`,
      }
      return { edge: e, otherId: e.from, sentence: sentences[e.kind] }
    })

  return { outgoing, incoming }
}

/** Supertypes that aren't in the uploaded code, e.g. AppCompatActivity. */
export function librarySupertypes(c: ClassInfo, classes: ClassInfo[]): string[] {
  const known = new Set(classes.map((k) => k.name))
  return c.supertypes.filter((s) => !known.has(s.name)).map((s) => s.name)
}