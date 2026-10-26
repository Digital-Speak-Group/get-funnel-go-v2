"use client";

import * as React from "react";
import { BarChart3, Minus, Plus, Table2, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  CHART_TYPES,
  MAX_CHART_POINTS,
  MAX_TABLE_COLS,
  MAX_TABLE_ROWS,
  type FreeChart,
  type FreeTable,
} from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";
import { parseVideoUrl } from "@/lib/slides/video";
import { cn } from "@/lib/utils";
import { FREE_MESSAGES } from "../messages";
import { inputClass } from "../fields/field-ui";
import { ColorPicker } from "./StyleControls";
import { addTableColumn, addTableRow, removeTableColumn, removeTableRow } from "./table-ops";

const m = FREE_MESSAGES;
const keepFocus = (event: Event) => event.preventDefault();

function Segmented<T extends string>({ label, value, options, labels, onChange }: { label: string; value: T; options: readonly T[]; labels: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          data-testid={`free-option-${option}`}
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-1 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            value === option ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

/** Rows, columns, header, style, colour and text size of the selected table (Task 78). */
export function TableControls({ table, theme, onChange }: { table: FreeTable; theme: ThemeTokens; onChange: (next: FreeTable, group?: string) => void }) {
  const rows = table.rows.length;
  const cols = table.rows[0].length;
  const apply = (next: FreeTable | null) => next && onChange(next);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" data-testid="free-table">
          <Table2 aria-hidden="true" />
          {m.table.button}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3 p-3" onCloseAutoFocus={keepFocus}>
        <p className="text-xs text-faint">{m.table.hint}</p>
        <div className="grid grid-cols-2 gap-2">
          <Stepper label={`${rows} ×`} onAdd={() => apply(addTableRow(table))} onRemove={() => apply(removeTableRow(table))} canAdd={rows < MAX_TABLE_ROWS} canRemove={rows > 1} addLabel={m.table.addRow} removeLabel={m.table.removeRow} testId="row" />
          <Stepper label={`${cols} col.`} onAdd={() => apply(addTableColumn(table))} onRemove={() => apply(removeTableColumn(table))} canAdd={cols < MAX_TABLE_COLS} canRemove={cols > 1} addLabel={m.table.addCol} removeLabel={m.table.removeCol} testId="col" />
        </div>
        <label className="flex items-center justify-between gap-2 text-small text-foreground">
          {m.table.header}
          <Switch checked={!!table.header} onCheckedChange={(header) => onChange({ ...table, header })} />
        </label>
        <Segmented label={m.table.variant} value={table.variant ?? "lines"} options={["lines", "striped", "grid"] as const} labels={m.table.variants} onChange={(variant) => onChange({ ...table, variant })} />
        <ColorPicker label={m.table.accent} value={table.accent ?? "primary"} theme={theme} onChange={(accent) => onChange({ ...table, accent })} />
        <label className="flex items-center justify-between gap-2 text-small text-foreground">
          {m.table.size}
          <input
            type="number"
            min={10}
            max={80}
            value={table.size ?? 24}
            className={cn(inputClass(false), "h-8 w-20 py-1")}
            onChange={(e) => {
              const size = Math.round(Number(e.target.value));
              if (size >= 10 && size <= 80) onChange({ ...table, size }, "table-size");
            }}
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}

function Stepper({ label, onAdd, onRemove, canAdd, canRemove, addLabel, removeLabel, testId }: { label: string; onAdd: () => void; onRemove: () => void; canAdd: boolean; canRemove: boolean; addLabel: string; removeLabel: string; testId: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-1">
      <Button type="button" size="icon-sm" variant="ghost" aria-label={removeLabel} title={removeLabel} disabled={!canRemove} onClick={onRemove} data-testid={`free-table-remove-${testId}`}>
        <Minus aria-hidden="true" />
      </Button>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{label}</span>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={addLabel} title={addLabel} disabled={!canAdd} onClick={onAdd} data-testid={`free-table-add-${testId}`}>
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}

/**
 * Data and look of the selected chart (Task 78). Controlled `open`, so a double-click on the
 * chart opens it too. Typing a value is one undo step per field burst.
 */
export function ChartControls({
  chart,
  theme,
  open,
  onOpenChange,
  onChange,
}: {
  chart: FreeChart;
  theme: ThemeTokens;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: FreeChart, group?: string) => void;
}) {
  const setPoint = (i: number, patch: Partial<FreeChart["data"][number]>, group: string) =>
    onChange({ ...chart, data: chart.data.map((d, j) => (j === i ? { ...d, ...patch } : d)) }, group);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" data-testid="free-chart">
          <BarChart3 aria-hidden="true" />
          {m.chart.button}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[70vh] w-80 space-y-3 overflow-y-auto p-3" onCloseAutoFocus={keepFocus}>
        <Segmented label={m.chart.type} value={chart.chart} options={CHART_TYPES} labels={m.chart.types} onChange={(type) => onChange({ ...chart, chart: type })} />
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_6rem_2rem] gap-1.5 text-xs font-medium text-faint">
            <span>{m.chart.label}</span>
            <span>{m.chart.value}</span>
          </div>
          {chart.data.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem_2rem] items-center gap-1.5">
              <input
                aria-label={`${m.chart.label} ${i + 1}`}
                value={d.label}
                maxLength={40}
                className={cn(inputClass(false), "h-8 py-1")}
                onChange={(e) => setPoint(i, { label: e.target.value }, `chart-label-${i}`)}
              />
              <input
                aria-label={`${m.chart.value} ${i + 1}`}
                type="number"
                value={Number.isFinite(d.value) ? d.value : 0}
                data-testid={`free-chart-value-${i}`}
                className={cn(inputClass(false), "h-8 py-1 font-mono tabular-nums")}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isFinite(value) && Math.abs(value) <= 1e9) setPoint(i, { value }, `chart-value-${i}`);
                }}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={m.chart.removePoint(d.label)}
                disabled={chart.data.length <= 1}
                onClick={() => onChange({ ...chart, data: chart.data.filter((_, j) => j !== i) })}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full"
            disabled={chart.data.length >= MAX_CHART_POINTS}
            data-testid="free-chart-add"
            onClick={() => onChange({ ...chart, data: [...chart.data, { label: `${chart.data.length + 1}`, value: 0 }] })}
          >
            <Plus aria-hidden="true" />
            {m.chart.addPoint}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <ColorPicker label={m.chart.color} value={chart.color ?? "primary"} theme={theme} onChange={(color) => onChange({ ...chart, color })} />
          <input
            aria-label={m.chart.unit}
            placeholder={m.chart.unitPlaceholder}
            value={chart.unit ?? ""}
            maxLength={8}
            className={cn(inputClass(false), "h-8 w-24 py-1")}
            onChange={(e) => onChange({ ...chart, unit: e.target.value || undefined }, "chart-unit")}
          />
        </div>
        <label className="flex items-center justify-between gap-2 text-small text-foreground">
          {m.chart.showValues}
          <Switch checked={chart.showValues ?? true} onCheckedChange={(showValues) => onChange({ ...chart, showValues })} />
        </label>
      </PopoverContent>
    </Popover>
  );
}

/** Asks for a YouTube/Vimeo link (Task 78): to add a video, or to change the selected one. */
export function VideoDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (video: NonNullable<ReturnType<typeof parseVideoUrl>>) => void;
}) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setUrl("");
      setError(false);
    }
  }, [open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const video = parseVideoUrl(url);
    if (!video) return setError(true);
    onConfirm(video);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-5 text-brand" aria-hidden="true" />
              {m.video.title}
            </DialogTitle>
            <DialogDescription>{m.video.hint}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <label htmlFor="free-video-url" className="text-small font-medium text-foreground">
              {m.video.label}
            </label>
            <input
              id="free-video-url"
              type="url"
              value={url}
              placeholder={m.video.placeholder}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass(error)}
              aria-invalid={error || undefined}
              data-testid="free-video-url"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{m.video.invalid}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {m.video.cancel}
            </Button>
            <Button type="submit" data-testid="free-video-confirm">
              {m.video.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
