/** Contact form rules, shared by the form (instant feedback) and the server (the real check). */

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export type ContactField = keyof ContactInput;
export type FieldErrors = Partial<Record<ContactField, string>>;

export const LIMITS = { name: 100, email: 254, messageMin: 10, message: 5000 } as const;

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
// control characters (incl. CR/LF, which could inject email headers) never belong in a name or address
const CONTROL = /[\u0000-\u001f\u007f]/g;

export function validateContact(raw: unknown): { ok: true; value: ContactInput } | { ok: false; fields: FieldErrors } {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  const value: ContactInput = {
    name: str(obj.name).replace(CONTROL, ' ').trim(),
    email: str(obj.email).replace(CONTROL, '').trim(),
    message: str(obj.message).trim(),
  };

  const fields: FieldErrors = {};
  if (!value.name) fields.name = 'What should I call you?';
  else if (value.name.length > LIMITS.name) fields.name = `Keep it under ${LIMITS.name} characters.`;

  if (!value.email) fields.email = 'I need an email to write back to.';
  else if (value.email.length > LIMITS.email || !EMAIL.test(value.email)) fields.email = "That email doesn't look right.";

  if (value.message.length < LIMITS.messageMin) fields.message = 'Write a little more, at least a sentence.';
  else if (value.message.length > LIMITS.message) fields.message = `That's a lot! Keep it under ${LIMITS.message} characters.`;

  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value };
}

/** What the API answers. */
export type ContactResponse = { ok: true } | { ok: false; error: string; fields?: FieldErrors };
