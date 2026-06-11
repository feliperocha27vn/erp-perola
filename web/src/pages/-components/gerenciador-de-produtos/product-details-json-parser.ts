import { z } from 'zod'
import type { ProductTechnicalDetailsForm } from './product-details-modal'

const developerDetailsSchema = z.object({
  produto: z.object({
    titulo: z.string(),
    subtitulo: z.string(),
    analise_tecnica: z.array(z.string()).min(1),
    diferenciais_tecnicos: z.array(z.string()),
    campos_detalhados: z.object({
      movimento: z.string(),
      caixa_e_cristal: z.string(),
      funcionalidade_especifica: z.string(),
      mostrador_e_luminosidade: z.string(),
      construcao_da_pulseira: z.string(),
    }),
    especificacoes_tecnicas: z.record(z.string(), z.string()),
  }),
})

function buildMarkdownTable(specs: Record<string, string>) {
  const header = ['| Caracteristica | Detalhe |', '| :--- | :--- |']
  const rows = Object.entries(specs).map(
    ([key, value]) => `| ${key.trim()} | ${value.trim()} |`
  )

  return [...header, ...rows].join('\n')
}

export function parseDeveloperDetailsJson(
  input: string
): ProductTechnicalDetailsForm {
  let parsed: unknown

  try {
    parsed = JSON.parse(input)
  } catch {
    throw new Error('JSON inválido')
  }

  const result = developerDetailsSchema.safeParse(parsed)

  if (!result.success) {
    throw new Error('JSON fora do formato esperado')
  }

  const { produto } = result.data

  const bulletList = produto.diferenciais_tecnicos
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => `- ${item}`)
    .join('\n')

  const functionalityBlocks = [
    produto.campos_detalhados.funcionalidade_especifica.trim(),
    bulletList ? `Diferenciais técnicos:\n${bulletList}` : '',
  ].filter(Boolean)

  return {
    technical_title: produto.titulo.trim(),
    technical_subtitle: produto.subtitulo.trim(),
    technical_analysis: produto.analise_tecnica
      .map(item => item.trim())
      .filter(Boolean)
      .join('\n\n'),
    technical_movement: produto.campos_detalhados.movimento.trim(),
    technical_case_and_crystal:
      produto.campos_detalhados.caixa_e_cristal.trim(),
    technical_specific_functionality: functionalityBlocks.join('\n\n'),
    technical_dial_and_luminosity:
      produto.campos_detalhados.mostrador_e_luminosidade.trim(),
    technical_bracelet_construction:
      produto.campos_detalhados.construcao_da_pulseira.trim(),
    technical_table: buildMarkdownTable(produto.especificacoes_tecnicas),
  }
}
