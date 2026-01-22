// Google Fonts available for slides

export interface FontFamily {
  name: string;
  value: string;
  category: 'sans-serif' | 'serif' | 'display' | 'japanese';
}

export const FONT_FAMILIES: FontFamily[] = [
  // Sans-serif
  { name: 'Instrument Sans', value: 'Instrument Sans', category: 'sans-serif' },
  { name: 'Inter', value: 'Inter', category: 'sans-serif' },
  
  // Serif
  { name: 'Newsreader', value: 'Newsreader', category: 'serif' },

  // Japanese
  { name: 'Noto Sans JP', value: 'Noto Sans JP', category: 'japanese' },
  { name: 'Noto Serif JP', value: 'Noto Serif JP', category: 'japanese' },
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128];

export const FONT_WEIGHTS = [
  { name: 'Light', value: '300' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semibold', value: '600' },
  { name: 'Bold', value: '700' },
];

export const TEXT_COLORS = [
  '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b',
  '#1e293b', '#0f172a', '#000000',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

export const BACKGROUND_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#1e293b', '#0f172a', '#18181b', '#000000',
  '#1e3a8a', '#312e81', '#4c1d95', '#831843',
  '#7f1d1d', '#78350f', '#365314', '#164e63',
];

export const GRADIENTS = [
  { name: 'Blue Purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Pink Red', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Cyan Blue', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Green Teal', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Pink Yellow', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Purple Pink', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Navy Blue', value: 'linear-gradient(180deg, #1e3a8a 0%, #312e81 100%)' },
  { name: 'Dark Navy', value: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
];
