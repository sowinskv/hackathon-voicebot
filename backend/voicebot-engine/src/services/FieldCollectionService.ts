import {
  FlowDefinition,
  FieldConfig,
  BranchConfig,
  FieldCollectionPlan,
  FieldValidationResult,
  ValidationRule,
  SessionContext,
} from '../../../shared-types/src';

/**
 * Service for collecting and validating fields based on current branch
 */
export class FieldCollectionService {
  /**
   * Get fields that need to be collected for a specific branch
   */
  getFieldsForBranch(
    branchId: string,
    branches: BranchConfig[],
    globalFields: FieldConfig[]
  ): FieldConfig[] {
    const branch = this.findBranchById(branches, branchId);

    if (!branch) {
      return globalFields;
    }

    // Check if we should inherit parent fields
    if (branch.inherit_parent_fields !== false) {
      // Combine global fields with branch-specific fields
      const allFields = [...globalFields, ...branch.required_fields];
      // Remove duplicates by field name
      const uniqueFields = allFields.filter(
        (field, index, self) => self.findIndex(f => f.name === field.name) === index
      );
      return uniqueFields;
    }

    return branch.required_fields;
  }

  /**
   * Create a collection plan for the current branch
   */
  async collectFieldsForBranch(
    branchId: string,
    branches: BranchConfig[],
    globalFields: FieldConfig[],
    sessionContext: Partial<SessionContext>
  ): Promise<FieldCollectionPlan> {
    // Get required fields for this branch
    const requiredFields = this.getFieldsForBranch(branchId, branches, globalFields);

    // Filter out already collected fields
    const collectedFields = sessionContext.collected_fields || {};
    const missingFields = requiredFields.filter(
      field => !(field.name in collectedFields) || collectedFields[field.name] === null || collectedFields[field.name] === undefined
    );

    // Sort by priority (required first, then by order)
    const sortedFields = this.sortFieldsByPriority(missingFields);

    return {
      fields_to_collect: sortedFields,
      total_count: sortedFields.length,
      next_field: sortedFields.length > 0 ? sortedFields[0] : null,
    };
  }

  /**
   * Sort fields by priority
   */
  private sortFieldsByPriority(fields: FieldConfig[]): FieldConfig[] {
    return fields.sort((a, b) => {
      // Required fields first
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;

      // Then alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Validate a field value against its validation rules
   */
  async validateField(
    field: FieldConfig,
    value: any
  ): Promise<FieldValidationResult> {
    const errors: string[] = [];

    // Check if required
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`${field.label} is required`);
      return {
        valid: false,
        field_name: field.name,
        value,
        errors,
      };
    }

    // Skip validation if value is empty and field is not required
    if (!field.required && (value === null || value === undefined || value === '')) {
      return {
        valid: true,
        field_name: field.name,
        value,
        errors: [],
      };
    }

    // Run validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        const ruleError = this.checkValidationRule(rule, value);
        if (ruleError) {
          errors.push(ruleError);
        }
      }
    }

    return {
      valid: errors.length === 0,
      field_name: field.name,
      value,
      errors,
    };
  }

  /**
   * Check a single validation rule
   */
  private checkValidationRule(rule: ValidationRule, value: any): string | null {
    const { type, params = {}, error_message } = rule;

    switch (type) {
      case 'required': {
        if (value === null || value === undefined || value === '') {
          return error_message;
        }
        break;
      }

      case 'regex': {
        if (params.pattern) {
          const regex = new RegExp(params.pattern);
          if (!regex.test(String(value))) {
            return error_message;
          }
        }
        break;
      }

      case 'length': {
        const strValue = String(value);
        if (params.min !== undefined && strValue.length < params.min) {
          return error_message;
        }
        if (params.max !== undefined && strValue.length > params.max) {
          return error_message;
        }
        break;
      }

      case 'range': {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return error_message;
        }
        if (params.min !== undefined && numValue < params.min) {
          return error_message;
        }
        if (params.max !== undefined && numValue > params.max) {
          return error_message;
        }
        break;
      }

      case 'format': {
        // Handle common formats
        if (params.format === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            return error_message;
          }
        } else if (params.format === 'phone') {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(String(value))) {
            return error_message;
          }
        } else if (params.format === 'date') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return error_message;
          }
        }
        break;
      }

      default:
        // Unknown validation type - skip
        break;
    }

    return null;
  }

  /**
   * Find a branch by ID (supports nested branches)
   */
  private findBranchById(branches: BranchConfig[], branchId: string): BranchConfig | null {
    for (const branch of branches) {
      if (branch.id === branchId) {
        return branch;
      }
      // Check nested branches
      if (branch.sub_branches) {
        const found = this.findBranchById(branch.sub_branches, branchId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Check if all required fields for a branch are collected
   */
  isCollectionComplete(
    branchId: string,
    branches: BranchConfig[],
    globalFields: FieldConfig[],
    collectedFields: Record<string, any>
  ): boolean {
    const requiredFields = this.getFieldsForBranch(branchId, branches, globalFields);

    return requiredFields
      .filter(field => field.required)
      .every(field =>
        field.name in collectedFields &&
        collectedFields[field.name] !== null &&
        collectedFields[field.name] !== undefined &&
        collectedFields[field.name] !== ''
      );
  }
}
