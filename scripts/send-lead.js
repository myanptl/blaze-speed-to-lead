// Usage: npm run send -- samples/good-fit.json
import { readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'

const file = process.argv[2] ?? 'samples/good-fit.json'
const body = readFileSync(file, 'utf8')
const signature = 'sha256=' + createHmac('sha256', process.env.FB_APP_SECRET).update(body).digest('hex')

const res = await fetch(`http://localhost:${Number(process.env.PORT) || 3000}/webhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
  body,
})
console.log(res.status, await res.text())
