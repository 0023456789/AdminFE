import type { Rule } from 'antd/es/form';
import { vi } from '../../../i18n/vi';

export const planRules = {
  code: [
    { required: true, message: 'Vui lòng nhập mã gói cước' },
    { pattern: /^[A-Za-z0-9_-]{2,50}$/, message: 'Mã gói cước từ 2-50 ký tự, chỉ chứa chữ, số, gạch ngang, gạch dưới' }
  ] as Rule[],
  
  name: [
    { required: true, message: 'Vui lòng nhập tên gói cước' },
    { min: 2, max: 150, message: 'Tên gói cước từ 2-150 ký tự' }
  ] as Rule[],

  price: [
    { required: true, message: 'Vui lòng nhập giá gói cước' },
    { type: 'number', min: 0, message: 'Giá gói cước phải lớn hơn hoặc bằng 0' }
  ] as Rule[],

  durationMonths: [
    { required: true, message: 'Vui lòng chọn thời hạn' }
  ] as Rule[],

  quotaType: [
    { required: true, message: 'Vui lòng chọn loại chu kỳ' }
  ] as Rule[],

  dataQuotaMb: [
    { required: true, message: 'Vui lòng nhập dung lượng' },
    { type: 'number', min: 1, message: 'Dung lượng phải lớn hơn 0' }
  ] as Rule[],

  cycleDays: (quotaType: string): Rule[] => [
    { 
      required: quotaType === 'PER_CYCLE', 
      message: 'Vui lòng nhập số ngày chu kỳ' 
    },
    { type: 'number', min: 1, message: 'Số ngày chu kỳ phải lớn hơn 0' }
  ],

  cutoffPolicy: [
    { required: true, message: 'Vui lòng chọn chính sách khi hết data' }
  ] as Rule[],

  throttleSpeedKbps: (cutoffPolicy: string): Rule[] => [
    { 
      required: cutoffPolicy === 'THROTTLE', 
      message: 'Vui lòng nhập tốc độ hạ băng thông' 
    },
    { type: 'number', min: 1, message: 'Tốc độ hạ băng thông phải lớn hơn 0' }
  ],
};
