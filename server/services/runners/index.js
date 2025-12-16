import { JavaScriptRunner } from './javascriptRunner.js'
import { PythonRunner } from './pythonRunner.js'
import { JavaRunner } from './javaRunner.js'
import { getCompetencyLevel, COMPETENCY_LEVELS } from './baseRunner.js'

const runners = {
  javascript: JavaScriptRunner,
  python: PythonRunner,
  java: JavaRunner
}

export function getRunner(language, config = {}) {
  const RunnerClass = runners[language.toLowerCase()]
  if (!RunnerClass) {
    throw new Error(`No runner available for language: ${language}`)
  }
  return new RunnerClass(config)
}

export function getSupportedLanguages() {
  return Object.keys(runners)
}

export function registerRunner(language, RunnerClass) {
  runners[language.toLowerCase()] = RunnerClass
}

export { getCompetencyLevel, COMPETENCY_LEVELS }
