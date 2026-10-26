import * as React from "react";
import type { z } from "zod";
import { fieldLabel } from "../messages";
import { isOptionalSchema, stringBounds, type FieldErrors } from "../field-schema";
import { FieldLabel, FieldStatus, fieldId, inputClass } from "./field-ui";

interface TextInputProps {
  name: string;
  schema: z.ZodType;
  path: string;
  value: unknown;
  errors: FieldErrors;
  onChange: (next: unknown) => void;
}

/** A string field: textarea past 160 characters, input otherwise, with its count against the limit. */
export function TextInput({ name, schema, path, value, errors, onChange }: TextInputProps) {
  const bounds = stringBounds(schema);
  const str = typeof value === "string" ? value : "";
  const error = errors[path];
  const id = fieldId(path);
  const props = {
    id,
    value: str,
    "data-testid": `slide-field-${path}`,
    "aria-invalid": error ? true : undefined,
    className: inputClass(!!error),
  };

  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={fieldLabel(name)} optional={isOptionalSchema(schema)} />
      {(bounds.max ?? 0) > 160 ? (
        <textarea rows={3} {...props} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" {...props} onChange={(e) => onChange(e.target.value)} />
      )}
      <FieldStatus path={path} error={error} length={str.length} max={bounds.max} />
    </div>
  );
}

/** Notes and script: free text under the content fields. */
export function TextareaField({
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
      <FieldLabel htmlFor={id} label={fieldLabel(name)} optional />
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
