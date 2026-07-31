import { describe, expect, it } from 'vitest'
import { parseDeveloperDetailsJson } from './product-details-json-parser'

describe('parseDeveloperDetailsJson', () => {
  it('maps valid developer JSON into title + markdown description', () => {
    const input = JSON.stringify({
      produto: {
        titulo: 'Orient Star RE-AU0001S',
        subtitulo: 'Relógio mecânico automático com proposta clássica',
        analise_tecnica: [
          'Primeiro parágrafo técnico.',
          'Segundo parágrafo técnico.',
        ],
        diferenciais_tecnicos: [
          'Diferencial 1',
          'Diferencial 2',
          'Diferencial 3',
        ],
        campos_detalhados: {
          movimento: 'Calibre automático in-house.',
          caixa_e_cristal: 'Caixa em aço com cristal de safira.',
          funcionalidade_especifica: 'Calendário com exibição refinada.',
          mostrador_e_luminosidade:
            'Mostrador texturizado com boa legibilidade.',
          construcao_da_pulseira: 'Pulseira em aço com fecho dobrável.',
        },
        especificacoes_tecnicas: {
          Referencia: 'RE-AU0001S',
          EAN: '123456789',
          Colecao: 'Classic',
          Movimento: 'Automático',
          Frequencia: '21.600 bph',
          Joias: '22',
          'Reserva de Marcha': '40 horas',
          'Material da Caixa': 'Aço inox',
          'Diametro da Caixa': '38,5 mm',
          'Espessura da Caixa': '12,3 mm',
          'Material do Bezel': 'Aço inox',
          Cristal: 'Safira',
          Lumen: 'Não',
          'Fundo da Caixa': 'Transparente',
          Pulseira: 'Aço inox',
          'Tipo de Fecho': 'Dobrável',
          'Resistencia a Agua': '50 m',
          Funcoes: 'Horas, minutos, segundos, data',
          Certificacoes: 'Nao informado',
        },
      },
    })

    const result = parseDeveloperDetailsJson(input)

    expect(result.technical_title).toBe('Orient Star RE-AU0001S')

    expect(result.technical_description).toContain('## Subtítulo')
    expect(result.technical_description).toContain(
      'Relógio mecânico automático com proposta clássica'
    )
    expect(result.technical_description).toContain('## Análise Técnica')
    expect(result.technical_description).toContain('Primeiro parágrafo técnico.')
    expect(result.technical_description).toContain('Segundo parágrafo técnico.')
    expect(result.technical_description).toContain('## Movimento')
    expect(result.technical_description).toContain('Calibre automático in-house.')
    expect(result.technical_description).toContain('## Caixa e Cristal')
    expect(result.technical_description).toContain(
      'Caixa em aço com cristal de safira.'
    )
    expect(result.technical_description).toContain(
      '## Funcionalidade Específica'
    )
    expect(result.technical_description).toContain(
      'Calendário com exibição refinada.'
    )
    expect(result.technical_description).toContain('Diferenciais técnicos:')
    expect(result.technical_description).toContain('- Diferencial 1')
    expect(result.technical_description).toContain(
      '## Mostrador e Luminosidade'
    )
    expect(result.technical_description).toContain(
      'Mostrador texturizado com boa legibilidade.'
    )
    expect(result.technical_description).toContain(
      '## Construção da Pulseira'
    )
    expect(result.technical_description).toContain(
      'Pulseira em aço com fecho dobrável.'
    )
    expect(result.technical_description).toContain('## Tabela Técnica')
    expect(result.technical_description).toContain(
      '| Caracteristica | Detalhe |'
    )
    expect(result.technical_description).toContain(
      '| Referencia | RE-AU0001S |'
    )

    // Sections appear in a stable, predictable order
    const subtituloIdx = result.technical_description.indexOf('## Subtítulo')
    const tabelaIdx = result.technical_description.indexOf('## Tabela Técnica')
    expect(subtituloIdx).toBeGreaterThanOrEqual(0)
    expect(tabelaIdx).toBeGreaterThan(subtituloIdx)
  })

  it('throws when payload is not valid JSON', () => {
    expect(() => parseDeveloperDetailsJson('{')).toThrow('JSON inválido')
  })

  it('throws when payload does not match expected structure', () => {
    expect(() =>
      parseDeveloperDetailsJson(
        JSON.stringify({
          produto: {
            titulo: 'x',
          },
        })
      )
    ).toThrow('JSON fora do formato esperado')
  })
})
