import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../../models/Challenge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CACHE_DIR = path.join(__dirname, '..', '..', 'canonical-cache')

export class TestAlignmentAnalyzer {
  constructor(options = {}) {
    this.verbose = options.verbose || false
    this.discrepancies = []
  }

  async analyzeExercise(exerciseSlug, language) {
    const results = {
      exercise: exerciseSlug,
      language,
      aligned: true,
      issues: [],
      metrics: {
        canonicalTestCount: 0,
        storedTestCount: 0,
        matchingTests: 0,
        missingTests: [],
        extraTests: [],
        divergentTests: []
      }
    }

    try {
      const canonicalData = await this.loadCanonicalData(exerciseSlug)
      const storedData = await this.loadStoredTests(exerciseSlug, language)

      if (!canonicalData) {
        results.issues.push({
          type: 'missing_canonical',
          message: `No canonical data found for ${exerciseSlug}`
        })
        results.aligned = false
        return results
      }

      if (!storedData) {
        results.issues.push({
          type: 'missing_stored',
          message: `No stored tests found for ${exerciseSlug} (${language})`
        })
        results.aligned = false
        return results
      }

      const canonicalCases = this.flattenCanonicalCases(canonicalData)
      const storedCases = storedData.canonicalTests || []

      results.metrics.canonicalTestCount = canonicalCases.length
      results.metrics.storedTestCount = storedCases.length

      for (const canonical of canonicalCases) {
        const stored = storedCases.find(s => s.uuid === canonical.uuid)

        if (!stored) {
          results.metrics.missingTests.push({
            uuid: canonical.uuid,
            description: canonical.description
          })
          results.issues.push({
            type: 'missing_test',
            uuid: canonical.uuid,
            description: canonical.description
          })
        } else {
          const divergences = this.compareTestCase(canonical, stored)
          if (divergences.length > 0) {
            results.metrics.divergentTests.push({
              uuid: canonical.uuid,
              description: canonical.description,
              divergences
            })
            results.issues.push({
              type: 'divergent_test',
              uuid: canonical.uuid,
              description: canonical.description,
              divergences
            })
          } else {
            results.metrics.matchingTests++
          }
        }
      }

      const canonicalUuids = new Set(canonicalCases.map(c => c.uuid))
      for (const stored of storedCases) {
        if (!canonicalUuids.has(stored.uuid)) {
          results.metrics.extraTests.push({
            uuid: stored.uuid,
            description: stored.description
          })
          results.issues.push({
            type: 'extra_test',
            uuid: stored.uuid,
            description: stored.description,
            message: 'Test exists in stored data but not in canonical source'
          })
        }
      }

      results.aligned = results.issues.length === 0

    } catch (error) {
      results.issues.push({
        type: 'analysis_error',
        message: error.message
      })
      results.aligned = false
    }

    return results
  }

  async loadCanonicalData(exerciseSlug) {
    const cachePath = path.join(CACHE_DIR, exerciseSlug, 'canonical-data.json')
    try {
      const content = await fs.readFile(cachePath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  async loadStoredTests(exerciseSlug, language) {
    try {
      const challenge = await Challenge.findOne({
        exercismSlug: exerciseSlug,
        language
      }).lean()
      return challenge
    } catch {
      return null
    }
  }

  flattenCanonicalCases(canonicalData, parentDescription = '') {
    const cases = []

    const processGroup = (group, prefix = '') => {
      if (!group) return

      if (group.cases) {
        for (const item of group.cases) {
          if (item.cases) {
            const newPrefix = prefix ? `${prefix} > ${item.description}` : item.description
            processGroup(item, newPrefix)
          } else if (item.uuid) {
            cases.push({
              uuid: item.uuid,
              description: prefix ? `${prefix} > ${item.description}` : item.description,
              shortDescription: item.description,
              property: item.property,
              input: item.input,
              expected: item.expected,
              reimplements: item.reimplements
            })
          }
        }
      }
    }

    processGroup(canonicalData)
    return cases
  }

  compareTestCase(canonical, stored) {
    const divergences = []

    if (!this.deepEqual(canonical.input, stored.input)) {
      divergences.push({
        field: 'input',
        canonical: canonical.input,
        stored: stored.input
      })
    }

    if (!this.deepEqual(canonical.expected, stored.expected)) {
      divergences.push({
        field: 'expected',
        canonical: canonical.expected,
        stored: stored.expected
      })
    }

    if (canonical.property !== stored.property) {
      divergences.push({
        field: 'property',
        canonical: canonical.property,
        stored: stored.property
      })
    }

    return divergences
  }

  deepEqual(a, b) {
    if (a === b) return true
    if (a === null || b === null) return a === b
    if (typeof a !== typeof b) return false
    if (typeof a !== 'object') return a === b
    if (Array.isArray(a) !== Array.isArray(b)) return false
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false
      return a.every((v, i) => this.deepEqual(v, b[i]))
    }
    const keysA = Object.keys(a).sort()
    const keysB = Object.keys(b).sort()
    if (keysA.length !== keysB.length) return false
    if (!keysA.every((k, i) => k === keysB[i])) return false
    return keysA.every(k => this.deepEqual(a[k], b[k]))
  }

  async analyzeAllExercises(language) {
    const challenges = await Challenge.find({ language }).lean()
    const results = []

    for (const challenge of challenges) {
      if (challenge.exercismSlug) {
        const result = await this.analyzeExercise(challenge.exercismSlug, language)
        results.push(result)
      }
    }

    return {
      language,
      totalExercises: results.length,
      alignedExercises: results.filter(r => r.aligned).length,
      misalignedExercises: results.filter(r => !r.aligned).length,
      exercises: results
    }
  }

  generateReport(analysisResults) {
    const report = {
      summary: {
        total: analysisResults.totalExercises,
        aligned: analysisResults.alignedExercises,
        misaligned: analysisResults.misalignedExercises,
        alignmentRate: analysisResults.totalExercises > 0 
          ? ((analysisResults.alignedExercises / analysisResults.totalExercises) * 100).toFixed(2) + '%'
          : '0%'
      },
      issues: {
        missingCanonical: [],
        missingStored: [],
        missingTests: [],
        divergentTests: [],
        extraTests: []
      }
    }

    for (const exercise of analysisResults.exercises) {
      for (const issue of exercise.issues) {
        switch (issue.type) {
          case 'missing_canonical':
            report.issues.missingCanonical.push(exercise.exercise)
            break
          case 'missing_stored':
            report.issues.missingStored.push(exercise.exercise)
            break
          case 'missing_test':
            report.issues.missingTests.push({
              exercise: exercise.exercise,
              uuid: issue.uuid,
              description: issue.description
            })
            break
          case 'divergent_test':
            report.issues.divergentTests.push({
              exercise: exercise.exercise,
              uuid: issue.uuid,
              description: issue.description,
              divergences: issue.divergences
            })
            break
          case 'extra_test':
            report.issues.extraTests.push({
              exercise: exercise.exercise,
              uuid: issue.uuid,
              description: issue.description
            })
            break
        }
      }
    }

    return report
  }
}

export async function runTestAlignment(language, exerciseSlug = null) {
  const analyzer = new TestAlignmentAnalyzer({ verbose: true })
  
  if (exerciseSlug) {
    return await analyzer.analyzeExercise(exerciseSlug, language)
  }
  
  const results = await analyzer.analyzeAllExercises(language)
  return analyzer.generateReport(results)
}
