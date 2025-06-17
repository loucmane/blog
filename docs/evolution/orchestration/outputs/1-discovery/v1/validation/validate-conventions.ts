#!/usr/bin/env tsx
/**
 * Convention Validation Script
 * Validates codebase against discovered conventions
 */

import { readdir, readFile, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import { execSync } from 'child_process'
import chalk from 'chalk'

interface ValidationResult {
  rule: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
  file?: string
}

class ConventionValidator {
  private results: ValidationResult[] = []
  private basePath: string

  constructor(basePath: string) {
    this.basePath = basePath
  }

  async validate(): Promise<void> {
    console.log(chalk.bold.blue('🔍 Validating Mom\'s Blog Conventions...\n'))

    await this.validateFileNaming()
    await this.validateComponentStructure()
    await this.validateImportOrder()
    await this.validateTypeOrganization()
    await this.validateErrorHandling()
    await this.validateAccessibility()
    await this.validateDirectoryStructure()

    this.printResults()
  }

  private async validateFileNaming(): Promise<void> {
    console.log(chalk.yellow('📝 Validating file naming conventions...'))
    
    const srcPath = join(this.basePath, 'src')
    const files = await this.getAllFiles(srcPath)

    for (const file of files) {
      const filename = basename(file)
      const ext = extname(file)

      // Component files
      if (ext === '.tsx' && file.includes('/components/')) {
        if (!/^[a-z]+(-[a-z]+)*\.tsx$/.test(filename)) {
          this.addResult({
            rule: 'file-naming',
            passed: false,
            message: `Component file should be kebab-case: ${filename}`,
            severity: 'error',
            file
          })
        }
      }

      // Hook files
      if (file.includes('/hooks/')) {
        if (!filename.startsWith('use-')) {
          this.addResult({
            rule: 'hook-naming',
            passed: false,
            message: `Hook file should start with 'use-': ${filename}`,
            severity: 'error',
            file
          })
        }
      }
    }
  }

  private async validateComponentStructure(): Promise<void> {
    console.log(chalk.yellow('🧩 Validating component structure...'))

    const componentsPath = join(this.basePath, 'src/components')
    const componentFiles = await this.getAllFiles(componentsPath, '.tsx')

    for (const file of componentFiles) {
      const content = await readFile(file, 'utf-8')

      // Check for forwardRef pattern
      if (!content.includes('React.forwardRef') && !content.includes('forwardRef')) {
        this.addResult({
          rule: 'component-forwardref',
          passed: false,
          message: 'Component should use React.forwardRef pattern',
          severity: 'warning',
          file
        })
      }

      // Check for displayName
      if (content.includes('forwardRef') && !content.includes('.displayName')) {
        this.addResult({
          rule: 'component-displayname',
          passed: false,
          message: 'forwardRef component missing displayName',
          severity: 'error',
          file
        })
      }

      // Check for named exports
      if (content.includes('export default')) {
        this.addResult({
          rule: 'named-exports',
          passed: false,
          message: 'Use named exports instead of default export',
          severity: 'error',
          file
        })
      }
    }
  }

  private async validateImportOrder(): Promise<void> {
    console.log(chalk.yellow('📦 Validating import order...'))

    const srcFiles = await this.getAllFiles(join(this.basePath, 'src'), '.tsx')
    
    for (const file of srcFiles) {
      const content = await readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      let lastImportType = ''
      const importOrder = ['react/next', 'external', 'monorepo', 'alias', 'relative', 'type']
      
      for (const line of lines) {
        if (line.startsWith('import')) {
          const currentType = this.getImportType(line)
          
          if (importOrder.indexOf(currentType) < importOrder.indexOf(lastImportType)) {
            this.addResult({
              rule: 'import-order',
              passed: false,
              message: `Import order violation: ${currentType} import after ${lastImportType}`,
              severity: 'warning',
              file
            })
          }
          
          lastImportType = currentType
        }
      }
    }
  }

  private async validateTypeOrganization(): Promise<void> {
    console.log(chalk.yellow('🏷️  Validating type organization...'))

    const typesPath = join(this.basePath, 'src/types')
    
    try {
      const typeFiles = await readdir(typesPath)
      
      for (const file of typeFiles) {
        if (file.endsWith('.ts')) {
          const content = await readFile(join(typesPath, file), 'utf-8')
          
          // Check for interface naming (no I prefix)
          const interfaceMatches = content.match(/interface\s+I[A-Z]/g)
          if (interfaceMatches) {
            this.addResult({
              rule: 'interface-naming',
              passed: false,
              message: 'Interfaces should not have "I" prefix',
              severity: 'error',
              file: join(typesPath, file)
            })
          }
          
          // Check for proper type exports
          if (!content.includes('export')) {
            this.addResult({
              rule: 'type-exports',
              passed: false,
              message: 'Types should be exported',
              severity: 'error',
              file: join(typesPath, file)
            })
          }
        }
      }
    } catch (error) {
      this.addResult({
        rule: 'type-directory',
        passed: false,
        message: 'Missing src/types directory',
        severity: 'error'
      })
    }
  }

  private async validateErrorHandling(): Promise<void> {
    console.log(chalk.yellow('⚠️  Validating error handling...'))

    const appPath = join(this.basePath, 'app')
    
    // Check for error.tsx files
    const errorFiles = await this.findFiles(appPath, 'error.tsx')
    
    for (const file of errorFiles) {
      const content = await readFile(file, 'utf-8')
      
      if (!content.includes("'use client'")) {
        this.addResult({
          rule: 'error-boundary-client',
          passed: false,
          message: 'error.tsx must have "use client" directive',
          severity: 'error',
          file
        })
      }
    }
  }

  private async validateAccessibility(): Promise<void> {
    console.log(chalk.yellow('♿ Validating accessibility...'))

    const componentFiles = await this.getAllFiles(join(this.basePath, 'src/components'), '.tsx')
    
    for (const file of componentFiles) {
      const content = await readFile(file, 'utf-8')
      
      // Check for minimum touch targets
      if (content.includes('Button') || content.includes('button')) {
        if (!content.includes('min-w-[44px]') && !content.includes('min-h-[44px]')) {
          this.addResult({
            rule: 'touch-target-size',
            passed: false,
            message: 'Interactive elements should have min 44px touch target',
            severity: 'warning',
            file
          })
        }
      }
      
      // Check for focus states
      if (!content.includes('focus-visible:')) {
        this.addResult({
          rule: 'focus-states',
          passed: false,
          message: 'Component missing focus-visible states',
          severity: 'warning',
          file
        })
      }
    }
  }

  private async validateDirectoryStructure(): Promise<void> {
    console.log(chalk.yellow('📁 Validating directory structure...'))

    const requiredDirs = [
      'src/app',
      'src/components',
      'src/components/ui',
      'src/types',
      'src/lib',
      'src/hooks',
      'src/config'
    ]

    for (const dir of requiredDirs) {
      const fullPath = join(this.basePath, dir)
      try {
        await stat(fullPath)
        this.addResult({
          rule: 'directory-structure',
          passed: true,
          message: `Required directory exists: ${dir}`,
          severity: 'info'
        })
      } catch {
        this.addResult({
          rule: 'directory-structure',
          passed: false,
          message: `Missing required directory: ${dir}`,
          severity: 'error'
        })
      }
    }
  }

  // Helper methods
  private async getAllFiles(dir: string, extension?: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          files.push(...await this.getAllFiles(fullPath, extension))
        } else if (entry.isFile()) {
          if (!extension || fullPath.endsWith(extension)) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files
  }

  private async findFiles(dir: string, filename: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory()) {
          files.push(...await this.findFiles(fullPath, filename))
        } else if (entry.name === filename) {
          files.push(fullPath)
        }
      }
    } catch {
      // Directory might not exist
    }
    
    return files
  }

  private getImportType(importLine: string): string {
    if (importLine.includes('from \'react\'') || importLine.includes('from \'next')) {
      return 'react/next'
    } else if (importLine.includes('from \'@minniewinnie/')) {
      return 'monorepo'
    } else if (importLine.includes('from \'@/')) {
      return 'alias'
    } else if (importLine.includes('from \'./') || importLine.includes('from \'../')) {
      return 'relative'
    } else if (importLine.includes('import type')) {
      return 'type'
    }
    return 'external'
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result)
  }

  private printResults(): void {
    console.log('\n' + chalk.bold.blue('📊 Validation Results:\n'))

    const errors = this.results.filter(r => r.severity === 'error' && !r.passed)
    const warnings = this.results.filter(r => r.severity === 'warning' && !r.passed)
    const passed = this.results.filter(r => r.passed)

    if (errors.length > 0) {
      console.log(chalk.red.bold(`❌ Errors (${errors.length}):`))
      errors.forEach(error => {
        console.log(chalk.red(`  - ${error.message}`))
        if (error.file) {
          console.log(chalk.gray(`    File: ${error.file.replace(this.basePath, '.')}`))
        }
      })
      console.log()
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow.bold(`⚠️  Warnings (${warnings.length}):`))
      warnings.forEach(warning => {
        console.log(chalk.yellow(`  - ${warning.message}`))
        if (warning.file) {
          console.log(chalk.gray(`    File: ${warning.file.replace(this.basePath, '.')}`))
        }
      })
      console.log()
    }

    console.log(chalk.green(`✅ Passed: ${passed.length} checks`))
    console.log(chalk.red(`❌ Failed: ${errors.length} errors`))
    console.log(chalk.yellow(`⚠️  Warnings: ${warnings.length} warnings`))

    const totalScore = (passed.length / this.results.length) * 100
    console.log('\n' + chalk.bold(`Overall Compliance Score: ${totalScore.toFixed(1)}%`))

    // Exit with error code if there are errors
    if (errors.length > 0) {
      process.exit(1)
    }
  }
}

// Run validation
const validator = new ConventionValidator(process.cwd())
validator.validate().catch(console.error)