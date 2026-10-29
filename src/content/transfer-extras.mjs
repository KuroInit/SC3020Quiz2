export const transferQuestionExtras = {
  'disk-algorithms': [
    {
      id: 'two-pass-sort-transfer',
      type: 'parts',
      prompt: String.raw`A relation occupies \(B=6{,}000\) disk blocks. The external-sort algorithm has \(M=80\) buffer blocks, creates initial runs from at most \(M\) blocks, and merges at most \(M-1\) runs per pass. Use the course's two-pass feasibility condition \(B\le M(M-1)\). Assume a feasible two-pass sort reads and writes the relation once in each pass. Report (1) the number of initial runs, (2) whether two passes suffice, and (3) the total sort I/O cost.`,
      expected: { runs: 75, feasible: 'yes', io: 24000 },
      answerFormat: {
        label: 'Run count · yes/no · total I/Os',
        hint: 'Enter three fields: a run count, yes or no, and a number of I/Os.',
        fields: {
          runs: { label: 'Initial sorted runs', placeholder: 'e.g. 75' },
          feasible: { label: 'Two passes feasible?', placeholder: 'yes or no' },
          io: { label: 'Total sort I/Os', placeholder: 'e.g. 24,000' }
        }
      },
      hint: String.raw`Compute \(\lceil B/M\rceil\) and compare \(B\) with \(M(M-1)\). For a feasible two-pass sort, count two reads and two writes of the relation.`,
      explanation: [
        String.raw`Initial runs: \(\lceil6{,}000/80\rceil=75\).`,
        String.raw`Feasibility bound: \(M(M-1)=80\cdot79=6{,}320\), and \(6{,}000\le6{,}320\), so two passes suffice.`,
        String.raw`Two-pass sort I/O: \(2\text{ passes}\times(1\text{ read}+1\text{ write})\times6{,}000=24{,}000\) I/Os.`
      ],
      source: 'Week 7 Two-Pass Algorithms note §§1–2; derived application of the stated course bound and pass-cost convention.',
      provenance: 'derived',
      review: {
        correct: 'You kept the initial-run calculation, feasibility test, and read/write cost as three separate steps.',
        incorrect: 'Check the fan-in bound first; do not confuse the number of runs with the number of I/O passes.',
        firstDivergence: 'The first calculation is the initial-run count: divide B by M and round up.',
        nextStep: 'Write the run count, compare the two-pass bound, then count reads and writes only if feasible.'
      }
    }
  ],
  'indexes-access': [
    {
      id: 'clustered-vs-scan-transfer',
      type: 'parts',
      prompt: String.raw`Relation \(R\) contains \(B(R)=240\) data blocks and \(T(R)=2{,}400\) tuples. An equality predicate \(A=7\) matches one of \(V(R,A)=20\) uniformly distributed values. A clustered index exists on \(A\). Ignore index-page I/Os and output writes; use the course's simplified clustered estimate \(B(R)/V(R,A)\) and compare it with a full scan costing \(B(R)\). Report (1) the estimated matching tuples, (2) clustered data-page I/Os, (3) full-scan I/Os, and (4) the cheaper access path.`,
      expected: { tuples: 120, index: 12, scan: 240, choice: 'clustered index' },
      answerFormat: {
        label: 'Tuples · index I/Os · scan I/Os · choice',
        hint: 'Enter three numbers, then choose “clustered index” or “full scan.”',
        fields: {
          tuples: { label: 'Matching tuples (estimate)', placeholder: 'e.g. 120' },
          index: { label: 'Clustered-index data I/Os', placeholder: 'e.g. 12' },
          scan: { label: 'Full-scan I/Os', placeholder: 'e.g. 240' },
          choice: { label: 'Cheaper access path', placeholder: 'clustered index or full scan' }
        }
      },
      hint: String.raw`Estimate tuples with \(T(R)/V(R,A)\), estimate clustered page reads with \(B(R)/V(R,A)\), then compare the latter with \(B(R)\).`,
      explanation: [
        String.raw`Matching tuples: \(2{,}400/20=120\).`,
        String.raw`Clustered data-page estimate: \(240/20=12\) I/Os.`,
        String.raw`Full scan: \(B(R)=240\) I/Os.`,
        'Because 12 is less than 240, the clustered-index path is cheaper under the stated simplified model.'
      ],
      source: 'Week 8 Index Joins and Scans note §4; derived access-path comparison using its stated estimates.',
      provenance: 'derived',
      review: {
        correct: 'You computed both the matching tuple estimate and page-I/O estimates, then compared the access paths.',
        incorrect: 'Do not compare tuple count directly with page I/Os. Calculate the clustered page estimate and scan cost separately.',
        firstDivergence: String.raw`The clustered estimate uses blocks: \(B(R)/V(R,A)\), not \(T(R)/V(R,A)\).`,
        nextStep: 'Put each estimate on its own line with its unit before choosing the cheaper path.'
      }
    }
  ],
  'logical-cardinality': [
    {
      id: 'selection-join-transfer',
      type: 'parts',
      prompt: String.raw`Relations \(R(A,B)\) and \(S(A,C)\) are joined on attribute \(A\). Relation \(R\) has \(T(R)=12{,}000\) tuples and \(V(R,A)=60\); relation \(S\) has \(T(S)=3{,}000\) tuples and \(V(S,A)=30\). The query first selects \(R\) rows satisfying \(A=7\), then joins those rows with S. Assume uniformity and containment, and use \(T(\sigma_{A=7}(R))\approx T(R)/V(R,A)\) followed by a join denominator of \(\max(V(R,A),V(S,A))\). Estimate (1) the selected R tuples and (2) the join-output tuples.`,
      expected: { selected: 200, joined: 10000 },
      answerFormat: {
        label: 'Selected R tuples · join-output tuples',
        hint: 'Enter two estimated tuple counts, in order; no unit suffix is needed.',
        fields: {
          selected: { label: 'Selected R (tuples)', placeholder: 'e.g. 200' },
          joined: { label: 'Join output (tuples)', placeholder: 'e.g. 10,000' }
        }
      },
      hint: String.raw`First estimate the selected R size. Then use that result as the left input to the join estimate and divide by the larger distinct-value count.`,
      explanation: [
        String.raw`Selected R: \(12{,}000/60=200\) tuples.`,
        String.raw`Join denominator: \(\max(60,30)=60\).`,
        String.raw`Join output: \((200\cdot3{,}000)/60=10{,}000\) tuples.`
      ],
      source: 'Week 9 Query Compiler and Cardinality note §6; derived two-stage estimate using the stated uniformity/containment assumptions.',
      provenance: 'derived',
      review: {
        correct: 'You applied selection before joining and carried the selected tuple count into the next calculation.',
        incorrect: 'Do not join the unfiltered 12,000 tuples: the query selects R first, so compute that intermediate size before the join.',
        firstDivergence: 'The first result is the filtered R size, found from T(R)/V(R,A).',
        nextStep: 'Label the selected relation size, then write the join denominator explicitly.'
      }
    }
  ],
  'optimization-costing': [
    {
      id: 'operator-cost-sum-transfer',
      type: 'parts',
      prompt: String.raw`A query optimizer has selected a physical plan with four operators. The given estimates are independent and non-overlapping (a parent operator's number does not include a child's cost): sequential scan/filter of R = 1,200 page I/Os; index access to S, including all tree and data-page reads = 350 page I/Os; join operator work = 2,400 page I/Os; final aggregation = 80 page I/Os. These estimates already exclude writing the final result. Report (1) the combined join-plus-aggregation cost and (2) the complete plan cost in page I/Os.`,
      expected: { joinAndAggregate: 2480, total: 4030 },
      answerFormat: {
        label: 'Join+aggregate subtotal · complete plan total',
        hint: 'Enter two page-I/O counts. Add the explicitly non-overlapping operator estimates once each.',
        fields: {
          joinAndAggregate: { label: 'Join + aggregation (page I/Os)', placeholder: 'e.g. 2,480' },
          total: { label: 'Complete plan (page I/Os)', placeholder: 'e.g. 4,030' }
        }
      },
      hint: 'Add the join and aggregation estimates for the first blank. For the complete plan, add the scan, index access, join, and aggregation estimates once each.',
      explanation: [
        String.raw`Join plus aggregation: \(2{,}400+80=2{,}480\) page I/Os.`,
        String.raw`Complete plan: \(1{,}200+350+2{,}400+80=4{,}030\) page I/Os.`,
        'The prompt states that the operator estimates are non-overlapping, so no child cost is counted twice.'
      ],
      source: 'Week 10 Plan Enumeration and Physical Plans note §§1–7; derived arithmetic exercise on summing explicit operator-cost components, not an official Example Class 8 total.',
      provenance: 'derived',
      review: {
        correct: 'You used the non-overlap rule and included each operator exactly once.',
        incorrect: 'Check that you added every operator cost but did not double-count child costs inside a parent estimate.',
        firstDivergence: 'The first subtotal is join plus aggregation; the complete plan then adds the scan and index access.',
        nextStep: 'Copy the four given components into a column and sum them once.'
      }
    }
  ]
};
