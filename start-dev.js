import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

process.chdir(dirname(fileURLToPath(import.meta.url)))

const { createServer } = await import('vite')
const server = await createServer({ configFile: './vite.config.ts' })
await server.listen()
server.printUrls()
