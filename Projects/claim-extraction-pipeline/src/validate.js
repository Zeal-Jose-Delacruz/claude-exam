// Minimal JSON-schema validator covering exactly the features CLAIM_SCHEMA
// uses (type, type-arrays, enum, required, additionalProperties, date
// format). Deliberately not a full AJV replacement — just enough to produce
// real, structured validation errors for the retry loop in Step 3.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function checkType(value, schema, path, errors) {
  const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = typeOf(value);
  if (!allowed.includes(actual)) {
    errors.push({
      path,
      keyword: "type",
      message: `${path} must be ${allowed.join(" or ")}, got ${actual} (${JSON.stringify(value)})`,
    });
    return false;
  }
  return true;
}

export function validateAgainstSchema(schema, data) {
  const errors = [];

  if (typeOf(data) !== "object") {
    return { valid: false, errors: [{ path: "$", keyword: "type", message: "root value must be an object" }] };
  }

  for (const key of schema.required || []) {
    if (!(key in data)) {
      errors.push({ path: key, keyword: "required", message: `${key} is required but missing` });
    }
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(data)) {
      if (!(key in schema.properties)) {
        errors.push({ path: key, keyword: "additionalProperties", message: `${key} is not an allowed field` });
      }
    }
  }

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (!(key in data)) continue;
    const value = data[key];

    if (!checkType(value, propSchema, key, errors)) continue;
    if (value === null) continue; // null already satisfied an allowed nullable type

    if (propSchema.enum && !propSchema.enum.includes(value)) {
      errors.push({
        path: key,
        keyword: "enum",
        message: `${key} must be one of [${propSchema.enum.join(", ")}], got ${JSON.stringify(value)}`,
      });
    }

    if (propSchema.format === "date" && typeof value === "string" && !ISO_DATE.test(value)) {
      errors.push({
        path: key,
        keyword: "format",
        message: `${key} was '${value}', not an ISO date (expected YYYY-MM-DD)`,
      });
    }

    if (propSchema.type === "number" || (Array.isArray(propSchema.type) && propSchema.type.includes("number"))) {
      if (typeof value === "number") {
        if (propSchema.minimum !== undefined && value < propSchema.minimum) {
          errors.push({ path: key, keyword: "minimum", message: `${key} must be >= ${propSchema.minimum}, got ${value}` });
        }
        if (propSchema.maximum !== undefined && value > propSchema.maximum) {
          errors.push({ path: key, keyword: "maximum", message: `${key} must be <= ${propSchema.maximum}, got ${value}` });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function formatValidationErrors(errors) {
  return errors.map((e) => `- ${e.message}`).join("\n");
}
