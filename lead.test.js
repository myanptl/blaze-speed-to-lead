import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { parseLead, verifySignature } from './lead.js'

const field = (name, value) => ({ name, values: [value] })

test('parses a Facebook field_data payload', () => {
  const lead = parseLead({
    id: '123',
    field_data: [field('full_name', ' Dana Ruiz '), field('email', 'dana@oakpm.com'), field('number_of_doors', '100-250')],
  })
  assert.deepEqual(lead, { fb_lead_id: '123', name: 'Dana Ruiz', email: 'dana@oakpm.com', doors: 100 })
})

test('unparseable door count becomes null', () => {
  const lead = parseLead({ field_data: [field('full_name', 'A'), field('phone_number', '555'), field('number_of_doors', 'lots')] })
  assert.equal(lead.doors, null)
})

test('rejects missing name, missing contact, bad email', () => {
  assert.throws(() => parseLead({}), /field_data/)
  assert.throws(() => parseLead({ field_data: [field('email', 'a@b.co')] }), /full_name/)
  assert.throws(() => parseLead({ field_data: [field('full_name', 'A')] }), /email or phone/)
  assert.throws(() => parseLead({ field_data: [field('full_name', 'A'), field('email', 'nope')] }), /invalid/)
})

test('verifySignature accepts the right HMAC only', () => {
  const body = Buffer.from('{"a":1}')
  const sig = 'sha256=' + createHmac('sha256', 's3cret').update(body).digest('hex')
  assert.equal(verifySignature(body, sig, 's3cret'), true)
  assert.equal(verifySignature(body, sig, 'wrong'), false)
  assert.equal(verifySignature(body, 'sha256=abc', 's3cret'), false)
  assert.equal(verifySignature(body, undefined, 's3cret'), false)
})
