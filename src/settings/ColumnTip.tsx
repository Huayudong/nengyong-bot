import { type ReactNode, use } from 'react'
import { MeasureContext } from './measure'
import { ModelSwatch } from './ModelSwatch'
import type { Column } from './UsageChart'
import { shareLabel, tokenLabel, valueLabel } from './usageFormat'
import {
  type Dimension,
  type Group,
  groupBy,
  inStackOrder,
  isUnpricedOnly,
  KEY_OF,
  totalsOf,
  type UsageNames,
} from './usageStats'
import { strings } from '../../shared/strings'

const TIP_LINES = 4

interface Props {
  column: Column
  place: { left: number; top: number } | { right: number; top: number }
  lineDimension: Dimension // what the lines split the day by: models once the chart stacks several, else the list's dimension
  dimension: Dimension
  pointed: string | null
  colors: Map<string, string>
  names: UsageNames
}

/** What a column of the chart amounts to, line by line, beside it. */
export function ColumnTip({ column, place, ...lines }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[200px] rounded-md bg-surface px-3 py-2.5 text-sm whitespace-nowrap shadow-pop"
      style={place}
    >
      <div className="text-xs text-muted">{column.period.heading}</div>
      {column.records.length ? (
        <TipLines column={column} {...lines} />
      ) : (
        <div className="text-muted">{column.period.emptyNote}</div>
      )}
    </div>
  )
}

function TipLines({ column, lineDimension, dimension, pointed, colors, names }: Omit<Props, 'place'>) {
  const measure = use(MeasureContext)
  const marksPointed = lineDimension === dimension
  const groups = groupBy(column.records, KEY_OF[lineDimension])
  const ordered =
    lineDimension === 'model'
      ? inStackOrder(groups, colors)
      : [...groups.filter((group) => group.key === pointed), ...groups.filter((group) => group.key !== pointed)]
  const rest = ordered.slice(TIP_LINES)
  const pointedPart =
    pointed !== null && !marksPointed
      ? totalsOf(column.records.filter((record) => KEY_OF[dimension](record) === pointed))
      : null
  return (
    <>
      <div className="mt-px flex items-baseline gap-2 font-semibold tabular-nums">
        {isUnpricedOnly(column.totals) ? strings().usage.tip.priceUnknown : measure.format(column.totals.amount)}
        {measure.kind !== 'tokens' && (
          <span className="text-xs font-normal text-muted">
            {strings().usage.format.tokens(tokenLabel(column.totals.tokens))}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-col gap-0.5 border-t border-line pt-1.5">
        {ordered.slice(0, TIP_LINES).map((group) => (
          <TipLine
            key={group.key}
            group={group}
            whole={column.totals.amount}
            isOn={marksPointed && group.key === pointed}
          >
            {lineDimension === 'model' && <ModelSwatch color={colors.get(group.key)} />}
            <span className={lineDimension === 'model' ? 'font-mono' : undefined}>
              {names.nameOf(lineDimension, group.key)}
            </span>
          </TipLine>
        ))}
        {rest.length > 0 && (
          <TipLine
            group={{ ...totalsOf(rest.flatMap((group) => group.records)), key: '', records: [] }}
            whole={column.totals.amount}
            isOn={false}
          >
            {strings().usage.tip.more(rest.length)}
          </TipLine>
        )}
      </div>
      {pointedPart && pointed !== null && (
        <div className="mt-1.5 text-xs text-muted">
          {strings().usage.tip.ofWhich(names.nameOf(dimension, pointed), valueLabel(pointedPart, measure))}
        </div>
      )}
    </>
  )
}

function TipLine({
  group,
  whole,
  isOn,
  children,
}: {
  group: Group
  whole: number
  isOn: boolean
  children: ReactNode
}) {
  const measure = use(MeasureContext)
  return (
    <div
      data-on={isOn || undefined}
      className="flex items-center justify-between gap-4 text-soft tabular-nums data-on:font-medium data-on:text-ink"
    >
      <span className="flex min-w-0 items-center gap-1.5">{children}</span>
      <span className="flex items-baseline gap-1.5">
        {valueLabel(group, measure)}
        <span className="w-8 text-right text-xs text-muted">
          {isUnpricedOnly(group) ? '' : shareLabel(group.amount, whole)}
        </span>
      </span>
    </div>
  )
}
