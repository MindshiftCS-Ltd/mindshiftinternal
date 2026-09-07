import type { FieldType } from '@/types/domain'

export const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'signature', label: 'Signature' },
]

export function fieldTypeLabel(type: FieldType) {
  return FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
