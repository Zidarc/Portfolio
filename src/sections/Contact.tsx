import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { GITHUB_URL, INSTAGRAM_URL, LINKEDIN_URL, RESUME_URL } from '../data/links.ts';
import { useInView } from '../hooks/useInView.ts';
import {
  LIMITS,
  validateContact,
  type ContactField,
  type ContactInput,
  type ContactResponse,
  type FieldErrors,
} from '../shared/contact.ts';
import './Contact.css';

const SOCIALS = [
  { label: 'Résumé', href: RESUME_URL, colour: 'orange' },
  { label: 'GitHub', href: GITHUB_URL, colour: 'graphite' },
  { label: 'LinkedIn', href: LINKEDIN_URL, colour: 'blue' },
  { label: 'Instagram', href: INSTAGRAM_URL, colour: 'red' },
];

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; name: string } | { kind: 'error'; message: string };

const EMPTY: ContactInput = { name: '', email: '', message: '' };

export function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const inView = useInView(formRef);
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  /** Spam traps: a field only bots fill in, and when the form was first shown. */
  const [website, setWebsite] = useState('');
  const startedAt = useRef(Date.now());

  const update = (field: ContactField) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const focusFirstError = (fields: FieldErrors) => {
    const first = (['name', 'email', 'message'] as const).find((f) => fields[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const checked = validateContact(values);
    if (!checked.ok) {
      setErrors(checked.fields);
      focusFirstError(checked.fields);
      return;
    }

    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...checked.value, website, startedAt: startedAt.current }),
      });
      const data = (await res.json()) as ContactResponse;
      if (data.ok) {
        setStatus({ kind: 'sent', name: checked.value.name });
        setValues(EMPTY);
        return;
      }
      if (data.fields) {
        setErrors(data.fields);
        focusFirstError(data.fields);
      }
      setStatus({ kind: 'error', message: data.error });
    } catch {
      setStatus({ kind: 'error', message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  const field = (name: ContactField, label: string, input: ReactNode) => (
    <div className={`field ${errors[name] ? 'field--invalid' : ''}`}>
      <label htmlFor={`contact-${name}`}>{label}</label>
      {input}
      {errors[name] && (
        <p id={`contact-${name}-error`} className="field__error">
          {errors[name]}
        </p>
      )}
    </div>
  );
  const a11y = (name: ContactField) => ({
    id: `contact-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  });

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-heading">
      <div className="contact__intro">
        <SectionHeading id="contact-heading" text="Say hi!" color="var(--crayon-purple)" />
        <p>
          Got a project, an internship, or just want to talk backend, systems or web stuff? Drop me a message and
          it'll land straight in my inbox.
        </p>
        <ul className="contact__socials">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" style={{ textDecorationColor: `var(--crayon-${s.colour})` }}>
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="contact__card">
        <CrayonShape shape="box" play={inView} tempo={1.4} lineWidth={3.5} color="var(--crayon-purple)" />

        {status.kind === 'sent' ? (
          <div className="contact__sent" role="status">
            <CrayonDoodle name="check" decorative tempo={1.5} weight={0.12} color="var(--crayon-green)" className="contact__check" />
            <p>Thanks, {status.name}! Your message is on its way. I'll write back soon.</p>
            <button type="button" className="contact__again" onClick={() => setStatus({ kind: 'idle' })}>
              write another
            </button>
          </div>
        ) : (
          <form ref={formRef} className="contact__form" noValidate onSubmit={submit}>
            {field('name', 'Your name', <input {...a11y('name')} autoComplete="name" maxLength={LIMITS.name} value={values.name} onChange={update('name')} />)}
            {field(
              'email',
              'Your email',
              <input {...a11y('email')} type="email" autoComplete="email" maxLength={LIMITS.email} value={values.email} onChange={update('email')} />,
            )}
            {field('message', 'Message', <textarea {...a11y('message')} rows={6} maxLength={LIMITS.message} value={values.message} onChange={update('message')} />)}

            {/* hidden from people; bots that fill every field give themselves away */}
            <div className="contact__trap" aria-hidden="true">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            <div className="contact__actions">
              <button type="submit" className="contact__send" disabled={status.kind === 'sending'}>
                <CrayonShape shape="box" play={inView} delay={900} tempo={2} lineWidth={2.5} color="var(--crayon-graphite)" />
                {status.kind === 'sending' ? 'sending…' : 'Send it ✉'}
              </button>
              {status.kind === 'error' && (
                <p className="contact__error" role="alert">
                  {status.message}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
