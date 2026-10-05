import { describe, it, expect } from 'vitest';
import {
  formatVND,
  formatDataQuota,
  formatQuotaDisplay,
  formatDuration,
} from './format';

describe('format utilities', () => {
  it('formats VND currency correctly', () => {
    const formatted = formatVND(150000);
    // Remove non-breaking spaces for comparison
    const normalized = formatted.replace(/\s/g, ' ');
    expect(normalized).toContain('150.000');
    expect(normalized).toContain('₫');
  });

  it('formats data quota in MB and GB', () => {
    expect(formatDataQuota(500)).toBe('500 MB');
    expect(formatDataQuota(1024)).toBe('1 GB');
    expect(formatDataQuota(5120)).toBe('5 GB');
    expect(formatDataQuota(1536)).toBe('1.5 GB');
  });

  it('formats quota display with quotaType', () => {
    expect(formatQuotaDisplay(5120, 'DAILY')).toBe('5 GB / ngày');
    expect(formatQuotaDisplay(5120, 'MONTHLY')).toBe('5 GB / tháng');
    expect(formatQuotaDisplay(5120, 'PER_CYCLE')).toBe('5 GB / chu kỳ');
    expect(formatQuotaDisplay(500, 'DAILY')).toBe('500 MB / ngày');
  });

  it('formats duration months', () => {
    expect(formatDuration(1)).toBe('1 tháng');
    expect(formatDuration(6)).toBe('6 tháng');
    expect(formatDuration(12)).toBe('12 tháng');
  });
});
