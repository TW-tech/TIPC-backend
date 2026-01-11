/**
 * 統一的文章驗證工具
 * 整合 Zod Schema 驗證和 Reference 完整性檢查
 */

import {
  CreateArticleSchema,
  UpdateArticleSchema,
  BlockDataSchema,
  ArticleBlockSchema,
  type CreateArticleInput,
  type UpdateArticleInput,
} from './article.schema'
import {
  validateReferenceIntegrity,
  assertReferenceIntegrity,
  collectReferencesFromBlocks,
  getReferenceUsageReport,
} from './reference-integrity'

export interface ValidationResult {
  success: boolean
  data?: any
  errors?: string[]
}

/**
 * 驗證文章創建數據
 * 包含 Zod Schema 驗證 + Reference 完整性檢查
 */
export function validateCreateArticle(
  input: unknown
): ValidationResult {
  const errors: string[] = []
  
  // Step 1: Zod Schema 驗證
  const zodResult = CreateArticleSchema.safeParse(input)
  
  if (!zodResult.success) {
    console.error('Zod validation failed:', zodResult.error)
    const zodErrors = zodResult.error?.issues?.map(err => 
      `${err.path.join('.')}: ${err.message}`
    )
    if (zodErrors && zodErrors.length > 0) {
      errors.push(...zodErrors)
    } else {
      errors.push('Validation failed: Unknown error')
    }
  }
  
  // 如果基本驗證失敗，直接返回
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  const data = zodResult.data as CreateArticleInput
  
  // Step 2: 驗證每個 block 的 data 結構
  for (let i = 0; i < data.blocks.length; i++) {
    const block = data.blocks[i]
    const blockDataResult = BlockDataSchema.safeParse({
      type: block.type,
      data: block.data,
    })
    
    if (!blockDataResult.success) {
      const blockErrors = blockDataResult.error.issues.map(err =>
        `blocks[${i}].${err.path.join('.')}: ${err.message}`
      )
      errors.push(...blockErrors)
    }
  }
  
  // Step 3: Reference 完整性檢查
  const refIntegrityResult = validateReferenceIntegrity(
    data.blocks,
    data.annotations || []
  )
  
  if (!refIntegrityResult.valid) {
    errors.push(...refIntegrityResult.errors)
  }
  
  // 返回結果
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return { success: true, data }
}

/**
 * 驗證文章更新數據
 * 包含 Zod Schema 驗證 + Reference 完整性檢查（如果有 blocks 和 annotations）
 */
export function validateUpdateArticle(
  input: unknown
): ValidationResult {
  const errors: string[] = []
  
  // Step 1: Zod Schema 驗證
  const zodResult = UpdateArticleSchema.safeParse(input)
  
  if (!zodResult.success) {
    const zodErrors = zodResult.error.issues.map(err =>
      `${err.path.join('.')}: ${err.message}`
    )
    errors.push(...zodErrors)
  }
  
  // 如果基本驗證失敗，直接返回
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  const data = zodResult.data as UpdateArticleInput
  
  // Step 2: 如果更新包含 blocks，驗證每個 block 的 data 結構
  if (data.blocks) {
    for (let i = 0; i < data.blocks.length; i++) {
      const block = data.blocks[i]
      const blockDataResult = BlockDataSchema.safeParse({
        type: block.type,
        data: block.data,
      })
      
      if (!blockDataResult.success) {
        const blockErrors = blockDataResult.error.issues.map(err =>
          `blocks[${i}].${err.path.join('.')}: ${err.message}`
        )
        errors.push(...blockErrors)
      }
    }
    
    // Step 3: 如果同時有 blocks 和 annotations，檢查 reference 完整性
    if (data.annotations) {
      const refIntegrityResult = validateReferenceIntegrity(
        data.blocks,
        data.annotations
      )
      
      if (!refIntegrityResult.valid) {
        errors.push(...refIntegrityResult.errors)
      }
    }
  }
  
  // 返回結果
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return { success: true, data }
}

/**
 * 嚴格版本：驗證失敗直接拋出錯誤
 * 適合用於 API endpoint
 */
export function assertValidCreateArticle(input: unknown): CreateArticleInput {
  const result = validateCreateArticle(input)
  
  if (!result.success) {
    throw new Error(
      `Article validation failed:\n${result.errors?.join('\n')}`
    )
  }
  
  return result.data as CreateArticleInput
}

export function assertValidUpdateArticle(input: unknown): UpdateArticleInput {
  const result = validateUpdateArticle(input)
  
  if (!result.success) {
    throw new Error(
      `Article validation failed:\n${result.errors?.join('\n')}`
    )
  }
  
  return result.data as UpdateArticleInput
}

// Re-export 其他工具函數
export {
  collectReferencesFromBlocks,
  validateReferenceIntegrity,
  assertReferenceIntegrity,
  getReferenceUsageReport,
}

// Re-export schemas
export * from './article.schema'
