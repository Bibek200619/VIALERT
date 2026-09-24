export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function requireRecord(body, allowedFields) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_INPUT', 'Request body must be a JSON object.');
  }

  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new ApiError(400, 'INVALID_INPUT', `Unknown fields: ${unknownFields.join(', ')}.`);
  }
}

export function requireString(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 80) {
    throw new ApiError(400, 'INVALID_INPUT', `${field} must be a non-empty string of at most 80 characters.`);
  }
  return value.trim();
}

export function requireEnum(value, field, choices) {
  if (!choices.includes(value)) {
    throw new ApiError(400, 'INVALID_INPUT', `${field} must be one of: ${choices.join(', ')}.`);
  }
  return value;
}

export function requireEntity(entity, label, id) {
  if (!entity) {
    throw new ApiError(404, 'NOT_FOUND', `${label} '${id}' was not found in the demo city.`);
  }
  return entity;
}
