import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('Starting Akodemy...')

const serverProcess = spawn('node', ['index.js'], {
  cwd: join(__dirname, 'server'),
  stdio: 'inherit',
  env: { ...process.env }
})

serverProcess.on('error', (err) => {
  console.error('Server error:', err)
})

serverProcess.on('exit', (code) => {
  console.log('Server process exited with code:', code)
  if (code !== 0) {
    console.log('Restarting server...')
    setTimeout(() => {
      const newServer = spawn('node', ['index.js'], {
        cwd: join(__dirname, 'server'),
        stdio: 'inherit',
        env: { ...process.env }
      })
    }, 1000)
  }
})

setTimeout(() => {
  console.log('Starting frontend...')
  const clientProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
    cwd: join(__dirname, 'client'),
    stdio: 'inherit',
    env: { ...process.env }
  })

  clientProcess.on('error', (err) => {
    console.error('Client error:', err)
  })
}, 3000)

process.on('SIGTERM', () => {
  serverProcess.kill()
  process.exit(0)
})
