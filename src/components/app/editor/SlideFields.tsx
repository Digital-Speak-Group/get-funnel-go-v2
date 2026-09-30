"use client";

import * as React from "react";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { slideContentSchemas } from "@/lib/slides/schema";
import { buildDefaultValue } from "@/lib/slides/defaults";
import { cn } from "@/lib/utils";
import { fieldLabel } from "./messages";
import {
  isOptionalSchema,
  stringBounds,
  unwrapSchema,
  type FieldErrors,
} from "./field-schema";
import type { EditorSlide } from "./validation";

const inputBase =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500";

function inputClass(hasError: boolean): string {
  return cn(inputBase, hasError && "border-red-500/70");
}

interface SlideFieldsProps {
  slide: EditorSlide;
  errors: FieldErrors;
  onChange: (patch: Partial<EditorSlide>) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function SlideFields({ slide, errors, onChange, onRegenerate, isRegenerating }: SlideFieldsProps) {
  const schema = slideContentSchemas[slide.type];
  const shape = (
    schema as unknown as z.ZodObject<Record<string, z.ZodType>>
  ).shape;

  return (
    <div className="space-y-4" data-testid="slide-fields">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white capitalize">{slide.type}</h3>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="text-xs px-2 py-1 bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            {isRegenerating ? "Regénération..." : "Regénérer (IA)"}
          </button>
        )}
      </div>
      <ShapeFields
        shape={shape}
        value={slide.content}
        path=""
        errors={errors}
        onChange={(next) => onChange({ content: next })}
      />

      <TextareaField
        name="notes"
        value={slide.notes}
        max={2000}
        error={errors.notes}
        onChange={(notes) => onChange({ notes })}
      />
      <TextareaField
        name="script"
        value={slide.script}
        max={4000}
        error={errors.script}
        onChange={(script) => onChange({ script })}
      />
    </div>
  );
}

function TextareaField({
  name,
  value,
  max,
  error,
  onChange,
}: {
  name: string;
  value: string;
  max: number;
  error?: string[];
  onChange: (next: string) => void;
}) {
  const id = `slide-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {fieldLabel(name)}
        <span className="font-normal text-zinc-500"> — facultatif</span>
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        data-testid={`slide-field-${name}`}
        aria-invalid={error ? true : undefined}
        className={inputClass(!!error)}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldStatus path={name} error={error} length={value.length} max={max} />
    </div>
  );
}

function FieldStatus({
  path,
  error,
  length,
  max,
}: {
  path: string;
  error?: string[];
  length: number;
  max?: number;
}) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span
        className="text-red-400"
        data-testid={error ? `slide-error-${path}` : undefined}
      >
        {error?.[0] ?? ""}
      </span>
      {max !== undefined && (
        <span className={cn("text-zinc-500", length > max && "text-red-400")}>
          {length}/{max}
        </span>
      )}
    </div>
  );
}

function ShapeFields({
  shape,
  value,
  path,
  errors,
  onChange,
}: {
  shape: Record<string, z.ZodType>;
  value: Record<string, unknown>;
  path: string;
  errors: FieldErrors;
  onChange: (next: Record<string, unknown>) => void;
}) {
  return (
    <>
      {Object.entries(shape).map(([key, fieldSchema]) => {
        const fieldPath = path ? `${path}.${key}` : key;
        return (
          <Field
            key={key}
            name={key}
            schema={fieldSchema}
            path={fieldPath}
            value={value[key]}
            errors={errors}
            onChange={(nextValue) => {
              const next = { ...value };
              if (nextValue === undefined) delete next[key];
              else next[key] = nextValue;
              onChange(next);
            }}
          />
        );
      })}
    </>
  );
}

function Field({
  name,
  schema,
  path,
  value,
  errors,
  onChange,
}: {
  name: string;
  schema: z.ZodType;
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}) {
  const core = unwrapSchema(schema);

  if (core instanceof z.ZodArray) {
    return (
      <ArrayField
        name={name}
        schema={core}
        path={path}
        value={value}
        errors={errors}
        onChange={onChange}
      />
    );
  }
  if (core instanceof z.ZodEnum) {
    return (
      <EnumField
        name={name}
        options={core.options.map((option) => String(option))}
        path={path}
        value={value}
        errors={errors}
        onChange={onChange}
      />
    );
  }
  if (core instanceof z.ZodBoolean) {
    const id = `field-${path.replace(/\./g, "-")}`;
    return (
      <div className="flex items-center gap-2 py-1">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          data-testid={`slide-field-${path}`}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-violet-500"
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={id} className="text-sm text-zinc-300">
          {fieldLabel(name)}
        </label>
      </div>
    );
  }

  return (
    <TextInput
      name={name}
      schema={schema}
      path={path}
      value={value}
      errors={errors}
      onChange={onChange}
    />
  );
}

function TextInput({
  name,
  schema,
  path,
  value,
  errors,
  onChange,
}: {
  name: string;
  schema: z.ZodType;
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}) {
  const bounds = stringBounds(schema);
  const str = typeof value === "string" ? value : "";
  const optional = isOptionalSchema(schema);
  const error = errors[path];
  const multiline = (bounds.max ?? 0) > 160;
  const id = `field-${path.replace(/\./g, "-")}`;

  const control = multiline ? (
    <textarea
      id={id}
      rows={3}
      value={str}
      data-testid={`slide-field-${path}`}
      aria-invalid={error ? true : undefined}
      className={inputClass(!!error)}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <input
      id={id}
      type="text"
      value={str}
      data-testid={`slide-field-${path}`}
      aria-invalid={error ? true : undefined}
      className={inputClass(!!error)}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {fieldLabel(name)}
        {optional && (
          <span className="font-normal text-zinc-500"> — facultatif</span>
        )}
      </label>
      {control}
      <FieldStatus path={path} error={error} length={str.length} max={bounds.max} />
    </div>
  );
}

function EnumField({
  name,
  options,
  path,
  value,
  errors,
  onChange,
}: {
  name: string;
  options: string[];
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}) {
  const error = errors[path];
  const id = `field-${path.replace(/\./g, "-")}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {fieldLabel(name)}
      </label>
      <select
        id={id}
        value={typeof value === "string" ? value : ""}
        data-testid={`slide-field-${path}`}
        aria-invalid={error ? true : undefined}
        className={inputClass(!!error)}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldStatus path={path} error={error} length={0} />
    </div>
  );
}

function ArrayField({
  name,
  schema,
  path,
  value,
  errors,
  onChange,
}: {
  name: string;
  schema: z.ZodArray;
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}) {
  const items = Array.isArray(value) ? value : [];
  const error = errors[path];
  const optional = isOptionalSchema(schema);
  const element = schema.element;
  const elementCore = unwrapSchema(element as z.ZodType);

  const update = (nextItems: unknown[]) => onChange(nextItems);
  const addItem = () =>
    update([...items, buildDefaultValue(element as z.ZodType, name)]);
  const removeItem = (index: number) =>
    update(items.filter((_, i) => i !== index));

  return (
    <fieldset
      className="space-y-3 rounded-xl border border-zinc-800 p-3"
      data-testid={`slide-field-${path}`}
    >
      <legend className="px-1 text-sm font-medium text-zinc-300">
        {fieldLabel(name)}
        <span className="font-normal text-zinc-500">
          {" "}
          ({items.length})
          {optional && " — facultatif"}
        </span>
      </legend>
      {error && (
        <p className="text-xs text-red-400" data-testid={`slide-error-${path}`}>
          {error[0]}
        </p>
      )}
      {items.length === 0 && (
        <p className="text-xs text-zinc-500">Aucun élément pour l’instant.</p>
      )}
      {items.map((item, index) => {
        const itemPath = `${path}.${index}`;
        return (
          <div key={index} className="space-y-2 rounded-lg bg-zinc-800/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {fieldLabel(name)} {index + 1}
              </span>
              <button
                type="button"
                aria-label={`Supprimer ${fieldLabel(name)} ${index + 1}`}
                data-testid={`slide-remove-${itemPath}`}
                className="rounded p-1 text-zinc-500 hover:text-red-400"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {elementCore instanceof z.ZodObject ? (
              <ShapeFields
                shape={elementCore.shape as Record<string, z.ZodType>}
                value={
                  item && typeof item === "object" && !Array.isArray(item)
                    ? (item as Record<string, unknown>)
                    : {}
                }
                path={itemPath}
                errors={errors}
                onChange={(next) =>
                  update(items.map((it, i) => (i === index ? next : it)))
                }
              />
            ) : (
              <TextInput
                name={name}
                schema={element as z.ZodType}
                path={itemPath}
                value={item}
                errors={errors}
                onChange={(next) =>
                  update(items.map((it, i) => (i === index ? next : it)))
                }
              />
            )}
          </div>
        );
      })}
      <button
        type="button"
        data-testid={`slide-add-${path}`}
        className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
        onClick={addItem}
      >
        <Plus className="h-4 w-4" /> Ajouter
      </button>
    </fieldset>
  );
}
