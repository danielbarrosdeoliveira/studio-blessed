// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { getDefaultAttributes } from 'eslint-plugin-better-tailwindcss/api/defaults'
import eslintConfigPrettier from 'eslint-config-prettier'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default withNuxt(
  // `eslint-config-prettier` desliga as regras de *whitespace* do ESLint para
  // não brigar com o Prettier. Precisa vir ANTES dos blocos que ativam regras
  // de formatação: como configs do flat config sobrescrevem as anteriores,
  // colocá-lo depois desligaria qualquer `vue/*` de formatação que a gente
  // ativar aqui.
  eslintConfigPrettier,
  {
    rules: {
      'vue/no-multiple-template-root': 'off',
      // `multiline: 3` e não o default `1`: o Prettier usa o formato "hug"
      // (`>` na linha seguinte) quando o conteúdo é um único nó de texto, o que
      // deixa os atributos na mesma linha. Com `multiline: 1` as duas ferramentas
      // brigam e o `lint:fix` alterna entre os dois formatos.
      'vue/max-attributes-per-line': ['error', { singleline: 10, multiline: 3 }]
    }
  },
  betterTailwindcss.configs['correctness-error'],
  {
    rules: {
      // Canonicaliza classes do Tailwind v4 com autofix:
      // `w-11 h-11` → `size-11`, `w-full h-full` → `size-full`,
      // `bg-gradient-to-r` → `bg-linear-to-r`, `text-sm leading-relaxed` → `text-sm/relaxed`.
      //
      // `leading-*` fica de fora: o line-height é *unitless* (`leading-[1.05]`
      // = 1.05) e não tem equivalente na escala de espaçamento. A regra
      // converteria para `leading-1.05`, classe que o Tailwind v4 não gera.
      'better-tailwindcss/enforce-canonical-classes': ['error', { ignore: ['^leading-'] }]
    }
  },
  {
    plugins: { tailwindcss },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/assets/css/main.css',
        attributes: [...getDefaultAttributes(), ['^v-bind:ui$', [{ match: 'objectValues' }]]]
      },
      // Caminho do CSS de entrada do Tailwind — usado para resolver a escala
      // de espaçamento e converter valores arbitrários em classes nativas.
      tailwindcss: {
        cssConfigPath: './app/assets/css/main.css'
      }
    },
    rules: {
      // Canonicalização respaldada pelo compilador do Tailwind v4.3+: renomeações
      // da v4 (`bg-gradient-to-r` → `bg-linear-to-r`) e valores arbitrários que
      // já existem no tema. Ao contrário das regras abaixo, ela pergunta ao
      // compilador — por isso não erra em `leading-[1.05]`.
      'tailwindcss/enforces-canonical-classname': 'error',
      // Valores arbitrários que já existem na escala de espaçamento:
      // `max-w-[1400px]` → `max-w-350`, `p-[16px]` → `p-4`, `mt-[24px]` → `mt-6`.
      'tailwindcss/no-unnecessary-arbitrary-value': 'error'
    }
  }
)
