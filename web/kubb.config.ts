import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  root: '.',
  input: {
    // Aponta para o swagger.json gerado pela API
    path: '../api/swagger.json',
  },
  output: {
    // Pasta onde os arquivos gerados serão salvos
    path: './src/api',
    clean: true,
  },
  plugins: [
    // 1. Plugin OAS - Parse do OpenAPI Schema
    pluginOas({
      output: false,
    }),
    // 2. Plugin TS - Gera TypeScript types
    pluginTs({
      output: {
        path: './types',
      },
      group: {
        type: 'tag',
      },
    }),
    // 3. Plugin Client - Gera cliente HTTP com axios
    pluginClient({
      output: {
        path: './clients',
      },
      group: {
        type: 'tag',
      },
      client: 'axios',
      importPath: '@/lib/kubb-axios-client',
    }),
    // 4. Plugin React Query - Gera hooks React Query
    pluginReactQuery({
      output: {
        path: './hooks',
      },
      group: {
        type: 'tag',
      },
      query: {
        key: key => key,
        methods: ['get'],
        importPath: '@tanstack/react-query',
      },
      mutation: {
        key: key => key,
        methods: ['post', 'put', 'patch', 'delete'],
        importPath: '@tanstack/react-query',
      },
      infinite: false,
    }),
  ],
})
