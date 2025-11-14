/**
 * Shared utility functions for commands
 */

/**
 * Mask a secret value for display purposes
 */
export function maskValue(value: string): string {
  if (value.length <= 8) {
    return "*".repeat(value.length);
  }
  return (
    value.substring(0, 4) +
    "*".repeat(value.length - 8) +
    value.substring(value.length - 4)
  );
}

/**
 * Escape a value for use in shell environment variables
 */
export function escapeShellValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

