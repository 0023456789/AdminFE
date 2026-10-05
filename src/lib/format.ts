/**
 * Format a number as Vietnamese Dong currency.
 * Example: 150000 -> "150.000 ₫"
 */
export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format data quota in MB to a human-readable string.
 * If >= 1024 MB, display in GB. Otherwise display in MB.
 * Example: 5120 -> "5 GB", 500 -> "500 MB"
 */
export function formatDataQuota(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    // Show integer if whole number, otherwise 1 decimal
    return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

/**
 * Format data quota with quota type for display in the plan list.
 * Example: (5120, 'DAILY') -> "5 GB / ngày"
 */
export function formatQuotaDisplay(
  mb: number, 
  quotaType: string, 
  cycleDays?: number | null
): string {
  const dataStr = formatDataQuota(mb);
  switch (quotaType) {
    case 'DAILY':
      return `${dataStr} / ngày`;
    case 'MONTHLY':
      return `${dataStr} / tháng`;
    case 'PER_CYCLE':
      return cycleDays ? `${dataStr} / ${cycleDays} ngày` : `${dataStr} / chu kỳ`;
    default:
      return dataStr;
  }
}

/**
 * Format duration months.
 * Example: 1 -> "1 tháng", 12 -> "12 tháng"
 */
export function formatDuration(months: number): string {
  return `${months} tháng`;
}
