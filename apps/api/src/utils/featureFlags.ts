/**
 * Feature Flags System
 * Toggle features without deployment
 */

import { logger } from './logger';

export interface FeatureFlags {
  // UI Features
  enableNewDashboard: boolean;
  enableDarkMode: boolean;
  enableAdvancedSearch: boolean;
  enableRealTimeNotifications: boolean;
  enableFilePreview: boolean;
  
  // API Features
  enableApiCaching: boolean;
  enableQueryOptimization: boolean;
  enableBatchOperations: boolean;
  
  // Experimental Features
  enableBetaFeatures: boolean;
  enableExperimentalUI: boolean;
  enableAIAssistant: boolean;
  
  // Maintenance
  enableMaintenanceMode: boolean;
  enableReadOnlyMode: boolean;
}

export interface UserFeatureContext {
  userId?: string;
  email?: string;
  role?: string;
}

class FeatureFlagService {
  private flags: FeatureFlags;
  private overrides: Map<string, boolean> = new Map();
  private userOverrides: Map<string, Partial<FeatureFlags>> = new Map();

  constructor() {
    // Initialize from environment variables
    this.flags = {
      // UI Features
      enableNewDashboard: this.getEnvFlag('FEATURE_NEW_DASHBOARD', false),
      enableDarkMode: this.getEnvFlag('FEATURE_DARK_MODE', true),
      enableAdvancedSearch: this.getEnvFlag('FEATURE_ADVANCED_SEARCH', false),
      enableRealTimeNotifications: this.getEnvFlag('FEATURE_REALTIME_NOTIFICATIONS', true),
      enableFilePreview: this.getEnvFlag('FEATURE_FILE_PREVIEW', true),
      
      // API Features
      enableApiCaching: this.getEnvFlag('FEATURE_API_CACHING', true),
      enableQueryOptimization: this.getEnvFlag('FEATURE_QUERY_OPTIMIZATION', true),
      enableBatchOperations: this.getEnvFlag('FEATURE_BATCH_OPERATIONS', false),
      
      // Experimental Features
      enableBetaFeatures: this.getEnvFlag('FEATURE_BETA', false),
      enableExperimentalUI: this.getEnvFlag('FEATURE_EXPERIMENTAL_UI', false),
      enableAIAssistant: this.getEnvFlag('FEATURE_AI_ASSISTANT', false),
      
      // Maintenance
      enableMaintenanceMode: this.getEnvFlag('FEATURE_MAINTENANCE_MODE', false),
      enableReadOnlyMode: this.getEnvFlag('FEATURE_READ_ONLY_MODE', false),
    };

    logger.info('Feature flags initialized', this.flags);
  }

  /**
   * Get flag value from environment
   */
  private getEnvFlag(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  /**
   * Check if feature is enabled globally
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    // Check override first
    if (this.overrides.has(flag)) {
      return this.overrides.get(flag)!;
    }

    return this.flags[flag];
  }

  /**
   * Check if feature is enabled for specific user
   */
  isEnabledForUser(flag: keyof FeatureFlags, context: UserFeatureContext): boolean {
    // Check user-specific override
    if (context.userId && this.userOverrides.has(context.userId)) {
      const userFlags = this.userOverrides.get(context.userId)!;
      if (userFlags[flag] !== undefined) {
        return userFlags[flag]!;
      }
    }

    // Check role-based access
    if (context.role) {
      const roleFlags = this.getRoleFlagOverrides(context.role);
      if (roleFlags[flag] !== undefined) {
        return roleFlags[flag]!;
      }
    }

    // Fall back to global flag
    return this.isEnabled(flag);
  }

  /**
   * Get role-based flag overrides
   */
  private getRoleFlagOverrides(role: string): Partial<FeatureFlags> {
    const roleOverrides: Record<string, Partial<FeatureFlags>> = {
      admin: {
        enableBetaFeatures: true,
        enableAdvancedSearch: true,
        enableBatchOperations: true,
      },
      coordinator: {
        enableAdvancedSearch: true,
        enableBatchOperations: true,
      },
      faculty: {
        enableAdvancedSearch: true,
      },
      student: {
        // Students get default flags
      },
    };

    return roleOverrides[role] || {};
  }

  /**
   * Enable feature globally
   */
  enable(flag: keyof FeatureFlags): void {
    this.overrides.set(flag, true);
    logger.info(`Feature flag enabled: ${flag}`);
  }

  /**
   * Disable feature globally
   */
  disable(flag: keyof FeatureFlags): void {
    this.overrides.set(flag, false);
    logger.info(`Feature flag disabled: ${flag}`);
  }

  /**
   * Enable feature for specific user
   */
  enableForUser(flag: keyof FeatureFlags, userId: string): void {
    const userFlags = this.userOverrides.get(userId) || {};
    userFlags[flag] = true;
    this.userOverrides.set(userId, userFlags);
    logger.info(`Feature flag enabled for user: ${flag} (${userId})`);
  }

  /**
   * Disable feature for specific user
   */
  disableForUser(flag: keyof FeatureFlags, userId: string): void {
    const userFlags = this.userOverrides.get(userId) || {};
    userFlags[flag] = false;
    this.userOverrides.set(userId, userFlags);
    logger.info(`Feature flag disabled for user: ${flag} (${userId})`);
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlags {
    const allFlags = { ...this.flags };
    
    // Apply overrides
    this.overrides.forEach((value, key) => {
      (allFlags as any)[key] = value;
    });

    return allFlags;
  }

  /**
   * Get flags for specific user
   */
  getFlagsForUser(context: UserFeatureContext): FeatureFlags {
    const flags = { ...this.flags };

    // Apply global overrides
    this.overrides.forEach((value, key) => {
      (flags as any)[key] = value;
    });

    // Apply role overrides
    if (context.role) {
      const roleFlags = this.getRoleFlagOverrides(context.role);
      Object.assign(flags, roleFlags);
    }

    // Apply user-specific overrides
    if (context.userId && this.userOverrides.has(context.userId)) {
      const userFlags = this.userOverrides.get(context.userId)!;
      Object.assign(flags, userFlags);
    }

    return flags;
  }

  /**
   * Reset all overrides
   */
  resetOverrides(): void {
    this.overrides.clear();
    this.userOverrides.clear();
    logger.info('Feature flag overrides reset');
  }

  /**
   * Percentage rollout (A/B testing)
   */
  isEnabledForPercentage(flag: keyof FeatureFlags, userId: string, percentage: number): boolean {
    if (!this.isEnabled(flag)) {
      return false;
    }

    // Hash user ID to get consistent percentage
    const hash = this.hashString(userId);
    const userPercentage = hash % 100;

    return userPercentage < percentage;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check multiple flags at once
   */
  areEnabled(flags: Array<keyof FeatureFlags>): boolean {
    return flags.every(flag => this.isEnabled(flag));
  }

  /**
   * Check if any of the flags are enabled
   */
  isAnyEnabled(flags: Array<keyof FeatureFlags>): boolean {
    return flags.some(flag => this.isEnabled(flag));
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagService();

/**
 * Express middleware to add feature flags to request
 */
export function featureFlagsMiddleware(req: any, res: any, next: any) {
  const context: UserFeatureContext = {
    userId: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
  };

  req.featureFlags = featureFlags.getFlagsForUser(context);
  req.isFeatureEnabled = (flag: keyof FeatureFlags) =>
    featureFlags.isEnabledForUser(flag, context);

  next();
}

/**
 * Usage Examples:
 * 
 * // Example 1: Check if feature is enabled
 * if (featureFlags.isEnabled('enableNewDashboard')) {
 *   // Use new dashboard
 * }
 * 
 * // Example 2: Check for specific user
 * const context = { userId: user.id, role: user.role };
 * if (featureFlags.isEnabledForUser('enableBetaFeatures', context)) {
 *   // Show beta features
 * }
 * 
 * // Example 3: In route handler
 * router.get('/projects', (req, res) => {
 *   if (req.isFeatureEnabled('enableAdvancedSearch')) {
 *     // Use advanced search
 *   } else {
 *     // Use basic search
 *   }
 * });
 * 
 * // Example 4: A/B testing (50% rollout)
 * if (featureFlags.isEnabledForPercentage('enableNewDashboard', userId, 50)) {
 *   // User is in the 50% that sees new dashboard
 * }
 * 
 * // Example 5: Enable/disable at runtime
 * featureFlags.enable('enableBetaFeatures');
 * featureFlags.disable('enableMaintenanceMode');
 * 
 * // Example 6: User-specific flags
 * featureFlags.enableForUser('enableAIAssistant', 'user-123');
 * 
 * // Example 7: Get all flags for API response
 * router.get('/feature-flags', (req, res) => {
 *   const flags = featureFlags.getFlagsForUser({
 *     userId: req.user.id,
 *     role: req.user.role,
 *   });
 *   res.json({ success: true, data: flags });
 * });
 */
