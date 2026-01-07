// Style and font definitions for the theme system

export interface StyleColors {
	bgPrimary: string;
	bgSurface: string;
	bgHover: string;
	colorPrimary: string;
	colorSecondary: string;
	colorAccent: string;
	colorError: string;
	colorSuccess: string;
	textPrimary: string;
	textSecondary: string;
	border: string;
}

export interface Style {
	name: string;
	colors: StyleColors;
}

export const STYLES: Record<string, Style> = {
	ember: {
		name: 'Ember',
		colors: {
			bgPrimary: '#1F2128',
			bgSurface: '#282A36',
			bgHover: '#353845',
			colorPrimary: '#E07B54',
			colorSecondary: '#00D9C0',
			colorAccent: '#F5A623',
			colorError: '#FF4747',
			colorSuccess: '#10B981',
			textPrimary: '#E8E6E3',
			textSecondary: '#9CA3AF',
			border: '#3F4251'
		}
	},
	violet: {
		name: 'Violet',
		colors: {
			bgPrimary: '#1A1D21',
			bgSurface: '#22262B',
			bgHover: '#2D3239',
			colorPrimary: '#8B5CF6',
			colorSecondary: '#06B6D4',
			colorAccent: '#FBBF24',
			colorError: '#EF4444',
			colorSuccess: '#10B981',
			textPrimary: '#F8FAFC',
			textSecondary: '#94A3B8',
			border: '#374151'
		}
	},
	amber: {
		name: 'Amber',
		colors: {
			bgPrimary: '#1C1917',
			bgSurface: '#292524',
			bgHover: '#3D3835',
			colorPrimary: '#F59E0B',
			colorSecondary: '#10B981',
			colorAccent: '#F97316',
			colorError: '#DC2626',
			colorSuccess: '#22C55E',
			textPrimary: '#FAFAF9',
			textSecondary: '#A8A29E',
			border: '#44403C'
		}
	}
};

export const FONTS = [
	{
		id: 'plus-jakarta-sans',
		name: 'Plus Jakarta Sans',
		family: "'Plus Jakarta Sans Variable', sans-serif"
	},
	{ id: 'outfit', name: 'Outfit', family: "'Outfit Variable', sans-serif" },
	{ id: 'manrope', name: 'Manrope', family: "'Manrope Variable', sans-serif" },
	{ id: 'noto-sans', name: 'Noto Sans', family: "'Noto Sans Variable', sans-serif" }
] as const;

export type StyleKey = keyof typeof STYLES;
export type FontId = (typeof FONTS)[number]['id'];

export const DEFAULT_STYLE: StyleKey = 'ember';
export const DEFAULT_FONT: FontId = 'plus-jakarta-sans';
