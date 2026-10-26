import * as React from "react";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { buildDefaultValue } from "@/lib/slides/defaults";
import { FIELD_MESSAGES as m, fieldLabel } from "../messages";
import { isOptionalSchema, unwrapSchema, type FieldErrors } from "../field-schema";
import { ShapeFields } from "./Field";
import { TextInput } from "./TextInput";

interface ArrayFieldProps {
  name: string;
  schema: z.ZodArray;
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}

/** A list (pain points, steps…): one card per item with its fields, plus add/remove. */
export function ArrayField({ name, schema, path, value, errors, onChange }: ArrayFieldProps) {
  const items = Array.isArray(value) ? value : [];
  const error = errors[path];
  const element = schema.element as z.ZodType;
  const elementCore = unwrapSchema(element);
  const label = fieldLabel(name);
  const setItem = (index: number, next: unknown) => onChange(items.map((it, i) => (i === index ? next : it)));

  return (
    <fieldset className="space-y-3 rounded-md border border-border p-3" data-testid={`slide-field-${path}`}>
      <legend className="px-1 text-small font-medium text-foreground">
        {label}
        <span className="font-normal text-faint">
          {" "}
          ({items.length}){isOptionalSchema(schema) && ` — ${m.optional}`}
        </span>
      </legend>
      {error && (
        <p className="text-xs text-danger" data-testid={`slide-error-${path}`}>
          {error[0]}
        </p>
      )}
      {items.length === 0 && <p className="text-xs text-faint">{m.emptyList}</p>}
      {items.map((item, index) => {
        const itemPath = `${path}.${index}`;
        return (
          <div key={index} className="space-y-2 rounded-md bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-faint">
                {label} {index + 1}
              </span>
              <button
                type="button"
                aria-label={`${m.remove} ${label} ${index + 1}`}
                data-testid={`slide-remove-${itemPath}`}
                className="rounded p-1 text-faint outline-none hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
            {elementCore instanceof z.ZodObject ? (
              <ShapeFields
                shape={elementCore.shape as Record<string, z.ZodType>}
                value={item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : {}}
                path={itemPath}
                errors={errors}
                onChange={(next) => setItem(index, next)}
              />
            ) : (
              <TextInput name={name} schema={element} path={itemPath} value={item} errors={errors} onChange={(next) => setItem(index, next)} />
            )}
          </div>
        );
      })}
      <button
        type="button"
        data-testid={`slide-add-${path}`}
        className="flex items-center gap-1 rounded text-small text-brand outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onChange([...items, buildDefaultValue(element, name)])}
      >
        <Plus className="size-4" aria-hidden="true" /> {m.add}
      </button>
    </fieldset>
  );
}
