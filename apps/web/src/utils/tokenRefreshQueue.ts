/**
 * Token Refresh Queue
 * Prevents multiple simultaneous token refresh requests
 */

class TokenRefreshQueue {
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;

  /**
   * Execute token refresh with queue management
   * If refresh is already in progress, wait for it to complete
   */
  async refresh(refreshFn: () => Promise<boolean>): Promise<boolean> {
    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      console.log('⏳ Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    // Mark as refreshing
    this.isRefreshing = true;
    console.log('🔄 Starting token refresh...');

    // Start new refresh
    this.refreshPromise = refreshFn()
      .then((result) => {
        console.log(result ? '✅ Token refresh successful' : '❌ Token refresh failed');
        return result;
      })
      .catch((error) => {
        console.error('❌ Token refresh error:', error);
        return false;
      })
      .finally(() => {
        // Clean up
        this.refreshPromise = null;
        this.isRefreshing = false;
      });

    return this.refreshPromise;
  }

  /**
   * Check if refresh is currently in progress
   */
  isInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Clear the refresh queue (for logout)
   */
  clear(): void {
    this.refreshPromise = null;
    this.isRefreshing = false;
  }
}

// Export singleton instance
export const tokenRefreshQueue = new TokenRefreshQueue();
