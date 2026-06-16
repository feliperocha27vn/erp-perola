import 'dotenv/config'
import { resolve } from 'node:path'

const BASE_URL = process.env.COOLIFY_BASE_URL?.replace(/\/$/, '')
const API_TOKEN = process.env.COOLIFY_API_TOKEN
const APP_UUID = process.env.COOLIFY_APP_UUID

const POLL_INTERVAL_MS = 10_000
const MAX_POLL_MINUTES = 15

interface DeploymentResponse {
  id?: number
  status?: string
  finished_at?: string | null
  deployment_uuid?: string
  commit?: string
  logs?: string
}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) fail(`Variável de ambiente ${name} não definida`)
  return value
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}/api/v1${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const text = await response.text()
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!response.ok) {
    fail(`Coolify API retornou ${response.status}: ${JSON.stringify(data)}`)
  }

  return data as T
}

async function triggerDeploy(): Promise<string> {
  console.log('🚀 Disparando deploy na Coolify...')
  const result = await api<{ deployments: Array<{ deployment_uuid: string; message: string }> }>(
    '/deploy',
    {
      method: 'POST',
      body: JSON.stringify({ uuid: APP_UUID, force: true }),
    },
  )

  const deployment = result.deployments?.[0]
  if (!deployment?.deployment_uuid) {
    fail('Resposta da Coolify não trouxe deployment_uuid')
  }

  console.log(`✅ Deploy enfileirado: ${deployment.deployment_uuid}`)
  return deployment.deployment_uuid
}

async function getDeployment(uuid: string): Promise<DeploymentResponse> {
  return api<DeploymentResponse>(`/deployments/${uuid}`)
}

function formatLogs(logsJson: string | undefined): string {
  if (!logsJson) return '(sem logs)'
  try {
    const logs = JSON.parse(logsJson) as Array<{ timestamp?: string; type?: string; output?: string }>
    return logs
      .map((entry) => `[${entry.timestamp ?? '?'}] ${entry.output ?? ''}`)
      .join('\n')
  } catch {
    return logsJson
  }
}

async function waitForDeployment(uuid: string): Promise<void> {
  const start = Date.now()
  const maxMs = MAX_POLL_MINUTES * 60 * 1000

  while (Date.now() - start < maxMs) {
    const deployment = await getDeployment(uuid)
    const status = deployment.status ?? 'in_progress'

    process.stdout.write(`⏳ Status: ${status}\r`)

    if (status === 'finished') {
      console.log(`\n✅ Deploy finalizado com sucesso!`)
      console.log(`   Commit: ${deployment.commit ?? 'n/a'}`)
      return
    }

    if (status === 'failed') {
      console.log(`\n❌ Deploy falhou.`)
      console.log(`\n--- Últimos logs ---\n`)
      console.log(formatLogs(deployment.logs))
      process.exit(1)
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  fail(`Timeout: deploy não finalizou em ${MAX_POLL_MINUTES} minutos`)
}

async function checkApplicationHealth(): Promise<void> {
  try {
    const apps = await api<Array<{ uuid: string; status: string }>>('/applications')
    const app = apps.find((a) => a.uuid === APP_UUID)
    if (!app) {
      console.warn('⚠️ Aplicação não encontrada na listagem de health')
      return
    }
    console.log(`🏥 Aplicação: ${app.status}`)
  } catch (error) {
    console.warn('⚠️ Não foi possível verificar health da aplicação:', error)
  }
}

async function main() {
  requiredEnv('COOLIFY_BASE_URL')
  requiredEnv('COOLIFY_API_TOKEN')
  requiredEnv('COOLIFY_APP_UUID')

  const deploymentUuid = await triggerDeploy()
  await waitForDeployment(deploymentUuid)
  await checkApplicationHealth()
}

main().catch((error) => {
  console.error('💥 Erro inesperado:', error)
  process.exit(1)
})
