const js = require('@eslint/js')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')

module.exports = [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: {
        // Node
        process: 'readonly',
        console: 'readonly',
        // Vitest
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly'
      }
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...(tsPlugin.configs.recommended && tsPlugin.configs.recommended.rules ? tsPlugin.configs.recommended.rules : {})
    }
  }
]
