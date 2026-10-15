import * as React from "react";
import { z } from "zod";
import { fieldLabel, optionLabel } from "../messages";
import { isOptionalSchema, unwrapSchema, type FieldErrors } from "../field-schema";
import { AssetField } from "../AssetField";
import { ArrayField } from "./ArrayField";
import { TextInput } from "./TextInput";
import { FieldLabel, FieldStatus, fieldId, inputClass } from "./field-ui";
import { SLIDE_STYLE_KEYS } from "@/lib/slides/schema";

export interface FieldProps {
  name: string;
  schema: z.ZodType;
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}

/** One content field, picked from its schema: image, list, choice, number, checkbox or text. */
export function Field({ name, schema, path, value, errors, onChange }: FieldProps) {
  const core = unwrapSchema(schema);
  const error = errors[path];
  const id = fieldId(path);

  // Illustration, background and transition have their own pickers above the fields.
  if (name === path && (SLIDE_STYLE_KEYS as readonly string[]).includes(name)) return null;
  if (name === "assetId") {
    return <AssetField path={path} value={typeof value === "string" ? value : undefined} error={error} onChange={onChange} />;
  }
  if (core instanceof z.ZodArray) {
    return <ArrayField name={name} schema={core} path={path} value={value} errors={errors} onChange={onChange} />;
  }
  if (core instanceof z.ZodEnum) {
    return (
      <div className="space-y-1">
        <FieldLabel htmlFor={id} label={fieldLabel(name)} />
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          data-testid={`slide-field-${path}`}
          aria-invalid={error ? true : undefined}
          className={inputClass(!!error)}
          onChange={(e) => onChange(e.target.value)}
        >
          {core.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {optionLabel(String(option))}
            </option>
          ))}
        </select>
        <FieldStatus path={path} error={error} length={0} />
      </div>
    );
  }
  if (core instanceof z.ZodNumber) {
    return (
      <div className="space-y-1">
        <FieldLabel htmlFor={id} label={fieldLabel(name)} optional={isOptionalSchema(schema)} />
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={typeof value === "number" && !Number.isNaN(value) ? value : ""}
          data-testid={`slide-field-${path}`}
          aria-invalid={error ? true : undefined}
          className={inputClass(!!error)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
        <FieldStatus path={path} error={error} length={0} />
      </div>
    );
  }
  if (core instanceof z.ZodBoolean) {
    return (
      <div className="flex items-center gap-2 py-1">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          data-testid={`slide-field-${path}`}
          className="size-4 rounded border-border-strong bg-surface accent-primary"
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={id} className="text-small text-foreground">
          {fieldLabel(name)}
        </label>
      </div>
    );
  }
  return <TextInput name={name} schema={schema} path={path} value={value} errors={errors} onChange={onChange} />;
}

/** The fields of an object schema (a slide's content, or one list item). */
export function ShapeFields({
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
      {Object.entries(shape).map(([key, fieldSchema]) => (
        <Field
          key={key}
          name={key}
          schema={fieldSchema}
          path={path ? `${path}.${key}` : key}
          value={value[key]}
          errors={errors}
          onChange={(nextValue) => {
            const next = { ...value };
            if (nextValue === undefined) delete next[key];
            else next[key] = nextValue;
            onChange(next);
          }}
        />
      ))}
    </>
  );
}
