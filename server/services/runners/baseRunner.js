export class BaseRunner {
  constructor(config = {}) {
    this.timeout = config.timeout || 30000
    this.memoryLimit = config.memoryLimit || 256 * 1024 * 1024
    this.language = 'unknown'
  }

  async prepare(userCode, testCode, slug) {
    throw new Error('prepare() must be implemented by subclass')
  }

  async execute(preparedCode) {
    throw new Error('execute() must be implemented by subclass')
  }

  parseResults(output) {
    throw new Error('parseResults() must be implemented by subclass')
  }

  async run(userCode, testCode, slug) {
    const preparedCode = await this.prepare(userCode, testCode, slug)
    const output = await this.execute(preparedCode)
    return this.parseResults(output)
  }

  sanitizeCode(code) {
    return code
      .replace(/import\s+os\b/g, '# BLOCKED: import os')
      .replace(/import\s+subprocess\b/g, '# BLOCKED: import subprocess')
      .replace(/import\s+shutil\b/g, '# BLOCKED: import shutil')
      .replace(/eval\s*\(/g, '(() => { throw new Error("eval blocked") })(')
      .replace(/exec\s*\(/g, '(() => { throw new Error("exec blocked") })(')
      .replace(/require\s*\(\s*['"]child_process['"]\s*\)/g, '{}')
      .replace(/require\s*\(\s*['"]fs['"]\s*\)/g, '{}')
  }
}

export const COMPETENCY_LEVELS = {
  MASTERED: { name: 'Mastered', minRate: 0.9, color: 'green' },
  PROFICIENT: { name: 'Proficient', minRate: 0.75, color: 'blue' },
  DEVELOPING: { name: 'Developing', minRate: 0.5, color: 'yellow' },
  NOT_STARTED: { name: 'Not Started', minRate: 0, color: 'red' }
}

export function getCompetencyLevel(passRate) {
  if (passRate >= 0.9) return COMPETENCY_LEVELS.MASTERED
  if (passRate >= 0.75) return COMPETENCY_LEVELS.PROFICIENT
  if (passRate >= 0.5) return COMPETENCY_LEVELS.DEVELOPING
  return COMPETENCY_LEVELS.NOT_STARTED
}
