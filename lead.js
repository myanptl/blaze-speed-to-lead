import { createHmac, timingSafeEqual } from 'node:crypto'

// Facebook lead-form question names -> our column names
const FIELDS = {
  full_name: 'name',
  email: 'email',
  phone_number: 'phone',
  company_name: 'company',
  number_of_doors: 'doors',
  message: 'message',
}
const MAX_FIELD_LEN = 2000
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Body shape mirrors a Graph API lead: { id, created_time, field_data: [{ name, values: [...] }] }
export function parseLead(body) {
  if (!Array.isArray(body?.field_data)) throw new Error('field_data must be an array')

  const lead = { fb_lead_id: body.id ? String(body.id) : null }
  for (const field of body.field_data) {
    const key = FIELDS[field?.name]
    if (key && Array.isArray(field.values)) {
      lead[key] = String(field.values[0] ?? '').trim().slice(0, MAX_FIELD_LEN)
    }
  }

  if (!lead.name) throw new Error('full_name is required')
  if (!lead.email && !lead.phone) throw new Error('email or phone_number is required')
  if (lead.email && !EMAIL_RE.test(lead.email)) throw new Error('email is invalid')

  // Forms often send ranges like "100-250"; keep the lower bound
  const doors = Number.parseInt(lead.doors, 10)
  lead.doors = Number.isFinite(doors) && doors >= 0 ? doors : null
  return lead
}

// Same scheme Facebook uses: X-Hub-Signature-256: sha256=<hex HMAC of raw body>
export function verifySignature(rawBody, header, secret) {
  if (typeof header !== 'string' || !header.startsWith('sha256=')) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'))
  const given = Buffer.from(header.slice('sha256='.length))
  return given.length === expected.length && timingSafeEqual(given, expected)
}
