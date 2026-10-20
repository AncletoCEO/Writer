// SPDX-License-Identifier: AGPL-3.0-only

import { createCAdapter } from './c.js'
import { createCppAdapter } from './cpp.js'
import { createCSharpAdapter } from './csharp.js'
import { createGoAdapter } from './go.js'
import { createJavaAdapter } from './java.js'
import { createKotlinAdapter } from './kotlin.js'
import { createPhpAdapter } from './php.js'
import { createPythonAdapter } from './python.js'
import { createRubyAdapter } from './ruby.js'
import { createRustAdapter } from './rust.js'
import { createSwiftAdapter } from './swift.js'

export const adapters = [
  createPythonAdapter(),
  createGoAdapter(),
  createRustAdapter(),
  createCSharpAdapter(),
  createJavaAdapter(),
  createCAdapter(),
  createCppAdapter(),
  createPhpAdapter(),
  createRubyAdapter(),
  createSwiftAdapter(),
  createKotlinAdapter()
]
