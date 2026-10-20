// SPDX-License-Identifier: AGPL-3.0-only

// Extensiones de lenguajes que el core todavía no analiza por sí solo. El mapa es
// conservador a propósito: solo se reportan extensiones de código conocidas, no
// assets/binarios. Con el language pack activo, las extensiones de sus adapters dejan
// de clasificarse como no soportadas.
export const UNSUPPORTED_LANGUAGES = {
  '.py': 'python',
  '.pyi': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.cs': 'csharp',
  '.c': 'c',
  '.h': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hh': 'cpp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.scala': 'scala',
  '.lua': 'lua',
  '.dart': 'dart',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.nim': 'nim',
  '.asm': 'assembly',
  '.s': 'assembly',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.gd': 'gdscript'
}

export function unsupportedLanguageFor(extension) {
  return UNSUPPORTED_LANGUAGES[String(extension).toLowerCase()] ?? null
}
