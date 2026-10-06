import type { Rule } from 'antd/es/form';
import { vi } from '../../../i18n/vi';

export const planRules = {
  code: [
    { required: true, message: 'Vui lòng nhập mã gói cước' },
    { transform: (value: string) => value?.trim(), pattern: /^[A-Za-z0-9_-]{2,50}$/, message: 'Mã gói cước từ 2-50 ký tự, chỉ chứa chữ, số, gạch ngang, gạch dưới' }
  ] as Rule[],
  
  name: [
    { required: true, message: 'Vui lòng nhập tên gói cước' },
    { whitespace: true, min: 2, max: 150, message: 'Tên gói cước từ 2-150 ký tự và không được để trống' }
  ] as Rule[],

  price: [
    { required: true, message: 'Vui lòng nhập giá gói cước' },
    { type: 'number', min: 0, max: 999_999_999_999, message: 'Giá phải từ 0 đến 999.999.999.999 VNĐ' },
    { type: 'integer', message: 'Giá phải là số nguyên VNĐ' }
  ] as Rule[],

  durationMonths: [
    { required: true, message: 'Vui lòng chọn thời hạn' },
    { type: 'enum', enum: [1, 6, 12], message: 'Thời hạn chỉ được là 1, 6 hoặc 12 tháng' }
  ] as Rule[],

  quotaType: [
    { required: true, message: 'Vui lòng chọn loại chu kỳ' }
  ] as Rule[],

  dataQuotaMb: [
    { required: true, message: 'Vui lòng nhập dung lượng' },
    { type: 'number', min: 1, message: 'Dung lượng phải lớn hơn 0' },
    { type: 'integer', message: 'Dung lượng phải là số nguyên MB' }
  ] as Rule[],

  cycleDays: (quotaType: string, durationMonths?: number): Rule[] => [
    { 
      required: quotaType === 'PER_CYCLE', 
      message: 'Vui lòng nhập số ngày chu kỳ' 
    },
    { type: 'number', min: 1, max: 32767, message: 'Số ngày chu kỳ phải từ 1 đến 32767' },
    { type: 'integer', message: 'Số ngày chu kỳ phải là số nguyên' },
    {
      validator: (_, value) => quotaType !== 'PER_CYCLE' || !durationMonths || value == null || value <= durationMonths * 30
        ? Promise.resolve()
        : Promise.reject(new Error(`Số ngày chu kỳ không được vượt quá ${durationMonths * 30} ngày`)),
    }
  ],

  cutoffPolicy: [
    { required: true, message: 'Vui lòng chọn chính sách khi hết data' }
  ] as Rule[],

  throttleSpeedKbps: (cutoffPolicy: string): Rule[] => [
    { 
      required: cutoffPolicy === 'THROTTLE', 
      message: 'Vui lòng nhập tốc độ hạ băng thông' 
    },
    { type: 'number', min: 1, message: 'Tốc độ hạ băng thông phải lớn hơn 0' },
    { type: 'integer', message: 'Tốc độ phải là số nguyên' }
  ],
  description: [{ max: 1000, message: 'Mô tả tối đa 1000 ký tự' }] as Rule[],
  voiceMinutes: [
    { type: 'number', min: 0, message: 'Phút gọi phải lớn hơn hoặc bằng 0' },
    { type: 'integer', message: 'Phút gọi phải là số nguyên' },
  ] as Rule[],
};
