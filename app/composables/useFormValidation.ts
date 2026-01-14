/**
 * Form Validation Composable
 * 
 * Standardizes form validation using Zod with type-safe error handling
 * 
 * Guidelines:
 * - Separate concerns: Forms in app/utils/validation/forms/*, DTOs in app/utils/validators/dto/*
 * - Prefer schema-per-form with explicit input/output typing
 * - Errors preserve multiple messages per field: Record<string, string[]>
 */

import { ref, computed, type Ref } from 'vue'
import { z, type ZodObject, type ZodError } from 'zod'

export interface FormValidationErrors {
  [field: string]: string[]
}

export interface FormValidationState {
  errors: FormValidationErrors
  touched: Record<string, boolean>
  isValid: boolean
  isDirty: boolean
}

/**
 * useFormValidation composable
 * 
 * @param schema - Zod schema (must be ZodObject for form validation)
 * @param initialValues - Initial form values
 */
export function useFormValidation<T extends z.ZodObject<any>>(
  schema: T,
  initialValues?: z.infer<T>
) {
  // Validate that schema is a ZodObject
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be a ZodObject for form validation')
  }

  const values = ref<z.infer<T>>(initialValues || ({} as z.infer<T>))
  const errors = ref<FormValidationErrors>({})
  const touched = ref<Record<string, boolean>>({})
  const isSubmitting = ref(false)

  /**
   * Validate all fields
   */
  function validateAll(): boolean {
    try {
      schema.parse(values.value)
      errors.value = {}
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.value = flattenZodErrors(error)
      } else {
        errors.value = {}
      }
      return false
    }
  }

  /**
   * Validate a single field
   * Uses schema.pick() to create a subset schema for the field
   */
  function validateField(field: keyof z.infer<T>): boolean {
    try {
      // Create a subset schema for this field
      const fieldSchema = schema.pick({ [field]: true } as any)
      fieldSchema.parse({ [field]: values.value[field] })
      
      // Remove error for this field if validation passes
      if (errors.value[field as string]) {
        const newErrors = { ...errors.value }
        delete newErrors[field as string]
        errors.value = newErrors
      }
      
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = flattenZodErrors(error)
        errors.value = {
          ...errors.value,
          ...fieldErrors,
        }
      }
      return false
    }
  }

  /**
   * Mark field as touched
   */
  function touchField(field: keyof z.infer<T>): void {
    touched.value = {
      ...touched.value,
      [field as string]: true,
    }
  }

  /**
   * Mark all fields as touched
   */
  function touchAll(): void {
    const allTouched: Record<string, boolean> = {}
    Object.keys(schema.shape).forEach((key) => {
      allTouched[key] = true
    })
    touched.value = allTouched
  }

  /**
   * Reset form state
   */
  function reset(newValues?: z.infer<T>): void {
    values.value = newValues || (initialValues || ({} as z.infer<T>))
    errors.value = {}
    touched.value = {}
    isSubmitting.value = false
  }

  /**
   * Set field value and optionally validate
   */
  function setFieldValue<K extends keyof z.infer<T>>(
    field: K,
    value: z.infer<T>[K],
    validate = false
  ): void {
    values.value = {
      ...values.value,
      [field]: value,
    }

    if (validate && touched.value[field as string]) {
      validateField(field)
    }
  }

  /**
   * Get error for a specific field (first error message)
   */
  function getFieldError(field: keyof z.infer<T>): string | undefined {
    const fieldErrors = errors.value[field as string]
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined
  }

  /**
   * Get all errors for a specific field
   */
  function getFieldErrors(field: keyof z.infer<T>): string[] {
    return errors.value[field as string] || []
  }

  /**
   * Check if field has error
   */
  function hasFieldError(field: keyof z.infer<T>): boolean {
    return !!(errors.value[field as string] && errors.value[field as string].length > 0)
  }

  /**
   * Check if field is touched
   */
  function isFieldTouched(field: keyof z.infer<T>): boolean {
    return !!touched.value[field as string]
  }

  // Computed properties
  const isValid = computed(() => {
    try {
      schema.parse(values.value)
      return true
    } catch {
      return false
    }
  })

  const isDirty = computed(() => {
    if (!initialValues) return false
    return JSON.stringify(values.value) !== JSON.stringify(initialValues)
  })

  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  return {
    // State
    values: values as Ref<z.infer<T>>,
    errors: computed(() => errors.value),
    touched: computed(() => touched.value),
    isValid,
    isDirty,
    hasErrors,
    isSubmitting: computed(() => isSubmitting.value),

    // Methods
    validateAll,
    validateField,
    touchField,
    touchAll,
    reset,
    setFieldValue,
    getFieldError,
    getFieldErrors,
    hasFieldError,
    isFieldTouched,
    setSubmitting: (value: boolean) => { isSubmitting.value = value },
  }
}

/**
 * Flatten Zod errors to Record<string, string[]>
 * Handles nested field paths (e.g., "address.city" -> "address.city")
 */
function flattenZodErrors(error: ZodError): FormValidationErrors {
  const flattened: FormValidationErrors = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!flattened[path]) {
      flattened[path] = []
    }
    flattened[path].push(issue.message)
  }

  return flattened
}

/**
 * Helper to create validation rules from Zod schema
 * Useful for integrating with existing validation utilities
 */
export function createValidationRules<T extends z.ZodObject<any>>(
  schema: T
): Record<string, any> {
  // This is a placeholder - actual implementation would convert Zod schema
  // to validation rules format if needed
  return {}
}
