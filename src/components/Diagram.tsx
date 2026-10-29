import { useId } from 'react';
import type { CourseLesson } from '../domain/types';

const diagramNames: Record<string, string> = {
  sort: 'External merge sort and sort-merge join',
  merge: 'Two sorted inputs being merged',
  hash: 'Grace and hybrid hash partitioning',
  index: 'Index lookup and data-page access',
  qep: 'PostgreSQL physical query execution plan',
  compiler: 'SQL compilation pipeline',
  optimizer: 'Join-order optimizer compares candidates'
};

export function Diagram({ kind, lesson }: { kind: string; lesson?: CourseLesson }) {
  const id = useId().replace(/:/g, '');
  const titleId = `diagram-title-${id}`;
  const arrowId = `arrow-${id}`;
  const arrowRef = `url(#${arrowId})`;
  const label = diagramNames[kind] ?? 'Query processing concept diagram';
  return <figure className={`diagram diagram-${kind}`} aria-label={label}>
    <svg viewBox="0 0 760 220" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{label}</title>
      {kind === 'sort' && <>
        <text x="28" y="36" className="svg-kicker">DISK INPUTS</text>
        <rect x="28" y="54" width="142" height="58" rx="12" className="svg-node soft"/><text x="99" y="88" textAnchor="middle">R blocks</text>
        <rect x="28" y="132" width="142" height="58" rx="12" className="svg-node soft"/><text x="99" y="166" textAnchor="middle">S blocks</text>
        <path d="M170 83 H220 M170 161 H220" className="svg-line"/><path d="M220 83 V161" className="svg-line"/><path d="M220 122 H260" className="svg-line" markerEnd={arrowRef}/>
        <rect x="260" y="66" width="160" height="112" rx="14" className="svg-node accent"/><text x="340" y="107" textAnchor="middle">Create sorted</text><text x="340" y="133" textAnchor="middle">runs / partitions</text><text x="340" y="157" textAnchor="middle" className="svg-small">read + write I/Os</text>
        <path d="M420 122 H475" className="svg-line" markerEnd={arrowRef}/>
        <rect x="475" y="66" width="126" height="112" rx="14" className="svg-node"/><text x="538" y="109" textAnchor="middle">Merge matching</text><text x="538" y="135" textAnchor="middle">runs</text>
        <path d="M601 122 H640" className="svg-line" markerEnd={arrowRef}/><rect x="640" y="84" width="98" height="76" rx="14" className="svg-node soft"/><text x="689" y="128" textAnchor="middle">Join result</text>
      </>}
      {kind === 'merge' && <>
        <text x="30" y="36" className="svg-kicker">COMPARE HEADS, EMIT, THEN ADVANCE</text>
        <rect x="28" y="54" width="270" height="56" rx="12" className="svg-node soft"/><text x="48" y="88">R:</text><rect x="95" y="67" width="48" height="32" rx="8" className="svg-node accent"/><text x="119" y="89" textAnchor="middle">4</text><text x="157" y="88">8</text><text x="211" y="88">12</text>
        <rect x="28" y="130" width="270" height="56" rx="12" className="svg-node soft"/><text x="48" y="164">S:</text><rect x="95" y="143" width="48" height="32" rx="8" className="svg-node"/><text x="119" y="165" textAnchor="middle">7</text><text x="157" y="164">9</text><text x="211" y="164">12</text>
        <path d="M300 121 H384" className="svg-line" markerEnd={arrowRef}/><rect x="384" y="78" width="150" height="84" rx="14" className="svg-node accent"/><text x="459" y="112" textAnchor="middle">Emit 4</text><text x="459" y="139" textAnchor="middle" className="svg-small">advance R only</text>
        <path d="M534 121 H602" className="svg-line" markerEnd={arrowRef}/><rect x="602" y="78" width="136" height="84" rx="14" className="svg-node soft"/><text x="670" y="112" textAnchor="middle">Output stream</text><text x="670" y="139" textAnchor="middle" className="svg-small">one key at a time</text>
      </>}
      {kind === 'index' && <>
        <text x="28" y="36" className="svg-kicker">INDEX → CANDIDATES → DATA PAGES → FILTER</text>
        <rect x="28" y="64" width="132" height="112" rx="14" className="svg-node accent"/><text x="94" y="108" textAnchor="middle">B+ tree /</text><text x="94" y="134" textAnchor="middle">bitmap index</text>
        <path d="M160 120 H216" className="svg-line" markerEnd={arrowRef}/><rect x="216" y="64" width="136" height="112" rx="14" className="svg-node"/><text x="284" y="108" textAnchor="middle">Row IDs /</text><text x="284" y="134" textAnchor="middle">candidate pages</text>
        <path d="M352 120 H408" className="svg-line" markerEnd={arrowRef}/><rect x="408" y="64" width="136" height="112" rx="14" className="svg-node soft"/><text x="476" y="108" textAnchor="middle">Fetch heap</text><text x="476" y="134" textAnchor="middle">pages</text>
        <path d="M544 120 H600" className="svg-line" markerEnd={arrowRef}/><rect x="600" y="64" width="138" height="112" rx="14" className="svg-node"/><text x="669" y="108" textAnchor="middle">Apply residual</text><text x="669" y="134" textAnchor="middle">predicates</text>
      </>}
      {kind === 'compiler' && <>
        <text x="28" y="36" className="svg-kicker">MEANING-PRESERVING TRANSFORMATIONS</text>
        {['SQL','Parse + check','Logical plan','Rewrite / estimate','Physical plan'].map((item, i) => {
          const x = 22 + i * 148;
          return <g key={item}><rect x={x} y="78" width="124" height="82" rx="14" className={i===3?'svg-node accent':'svg-node soft'}/><text x={x+62} y="124" textAnchor="middle">{item}</text>{i<4&&<path d={`M${x+124} 119 H${x+143}`} className="svg-line" markerEnd={arrowRef}/>}</g>;
        })}
        <text x="30" y="194" className="svg-small">Push filters only where their attributes exist; retain join/output attributes.</text>
      </>}
      {kind === 'optimizer' && <>
        <text x="28" y="36" className="svg-kicker">ENUMERATE → ESTIMATE → KEEP BEST SUBPLAN</text>
        <rect x="28" y="76" width="130" height="82" rx="14" className="svg-node soft"/><text x="93" y="109" textAnchor="middle">Relation set</text><text x="93" y="136" textAnchor="middle">{`{R,S,T,U}`}</text>
        <path d="M158 117 H212" className="svg-line" markerEnd={arrowRef}/>
        <rect x="212" y="58" width="158" height="54" rx="12" className="svg-node"/><text x="291" y="91" textAnchor="middle">Candidate tree A</text>
        <rect x="212" y="130" width="158" height="54" rx="12" className="svg-node soft"/><text x="291" y="163" textAnchor="middle">Candidate tree B</text>
        <path d="M370 85 H426 M370 157 H426 M426 85 V157 M426 121 H467" className="svg-line" markerEnd={arrowRef}/>
        <rect x="467" y="78" width="126" height="82" rx="14" className="svg-node"/><text x="530" y="111" textAnchor="middle">Estimate</text><text x="530" y="137" textAnchor="middle">cost + size</text>
        <path d="M593 119 H640" className="svg-line" markerEnd={arrowRef}/><rect x="640" y="78" width="98" height="82" rx="14" className="svg-node accent"/><text x="689" y="111" textAnchor="middle">Keep</text><text x="689" y="137" textAnchor="middle">best</text>
      </>}
      {kind === 'hash' && <>
        <text x="28" y="36" className="svg-kicker">PARTITION BOTH INPUTS · HYBRID KEEPS ONE R BUCKET</text>
        <rect x="28" y="72" width="130" height="82" rx="14" className="svg-node soft"/><text x="93" y="106" textAnchor="middle">R and S</text><text x="93" y="132" textAnchor="middle" className="svg-small">disk blocks</text>
        <path d="M158 113 H202" className="svg-line" markerEnd={arrowRef}/>
        <rect x="202" y="72" width="140" height="82" rx="14" className="svg-node"/><text x="272" y="106" textAnchor="middle">Hash by join</text><text x="272" y="132" textAnchor="middle">key into buckets</text>
        <path d="M342 113 H386" className="svg-line" markerEnd={arrowRef}/>
        <rect x="386" y="60" width="170" height="106" rx="14" className="svg-node accent"/><text x="471" y="95" textAnchor="middle">Grace: spill all</text><text x="471" y="120" textAnchor="middle">Hybrid: keep R₀</text><text x="471" y="146" textAnchor="middle" className="svg-small">less spill I/O</text>
        <path d="M556 113 H600" className="svg-line" markerEnd={arrowRef}/>
        <rect x="600" y="72" width="138" height="82" rx="14" className="svg-node soft"/><text x="669" y="106" textAnchor="middle">Join matching</text><text x="669" y="132" textAnchor="middle">buckets</text>
      </>}
      {kind === 'qep' && <>
        <text x="28" y="36" className="svg-kicker">FOLLOW THE PHYSICAL OPERATORS FROM LEAVES TO OUTPUT</text>
        {[['Scan','part'],['Scan + filter','lineitem'],['Hash join','partkey'],['Aggregate','T2'],['Gather','workers'],['Final aggregate','revenue']].map((lines, index) => {
          const x = 14 + index * 124;
          return <g key={lines.join('-')}><rect x={x} y="78" width="108" height="82" rx="12" className={index === 1 ? 'svg-node accent' : 'svg-node soft'}/><text x={x + 54} y="112" textAnchor="middle">{lines[0]}</text><text x={x + 54} y="136" textAnchor="middle" className="svg-small">{lines[1]}</text>{index < 5 && <path d={`M${x + 108} 119 H${x + 120}`} className="svg-line" markerEnd={arrowRef}/>}</g>;
        })}
        <text x="26" y="194" className="svg-small">Filter lineitem to the date range before hashing; aggregate before Gather and final aggregation.</text>
      </>}
      <defs><marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" className="svg-arrow"/></marker></defs>
    </svg>
    <figcaption>{lesson ? <><strong>{lesson.title}:</strong> {lesson.concept}</> : label}</figcaption>
  </figure>;
}
