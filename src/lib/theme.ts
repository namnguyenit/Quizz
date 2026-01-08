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
	},
	ocean: {
		name: 'Ocean',
		colors: {
			bgPrimary: '#0F172A',
			bgSurface: '#1E293B',
			bgHover: '#334155',
			colorPrimary: '#0EA5E9',
			colorSecondary: '#22D3EE',
			colorAccent: '#F472B6',
			colorError: '#F43F5E',
			colorSuccess: '#34D399',
			textPrimary: '#F1F5F9',
			textSecondary: '#94A3B8',
			border: '#475569'
		}
	},
	forest: {
		name: 'Forest',
		colors: {
			bgPrimary: '#14201A',
			bgSurface: '#1C2C24',
			bgHover: '#2A3F33',
			colorPrimary: '#22C55E',
			colorSecondary: '#84CC16',
			colorAccent: '#FACC15',
			colorError: '#EF4444',
			colorSuccess: '#4ADE80',
			textPrimary: '#ECFDF5',
			textSecondary: '#86EFAC',
			border: '#365446'
		}
	},
	rose: {
		name: 'Rose',
		colors: {
			bgPrimary: '#1C1419',
			bgSurface: '#2A1F25',
			bgHover: '#3D2D36',
			colorPrimary: '#F43F5E',
			colorSecondary: '#EC4899',
			colorAccent: '#FB923C',
			colorError: '#DC2626',
			colorSuccess: '#10B981',
			textPrimary: '#FFF1F2',
			textSecondary: '#FDA4AF',
			border: '#4C3942'
		}
	},
	midnight: {
		name: 'Midnight',
		colors: {
			bgPrimary: '#020617',
			bgSurface: '#0F172A',
			bgHover: '#1E293B',
			colorPrimary: '#6366F1',
			colorSecondary: '#A78BFA',
			colorAccent: '#38BDF8',
			colorError: '#F87171',
			colorSuccess: '#4ADE80',
			textPrimary: '#E2E8F0',
			textSecondary: '#64748B',
			border: '#334155'
		}
	},
	light: {
		name: 'Light',
		colors: {
			bgPrimary: '#F8FAFC',
			bgSurface: '#FFFFFF',
			bgHover: '#F1F5F9',
			colorPrimary: '#3B82F6',
			colorSecondary: '#8B5CF6',
			colorAccent: '#F59E0B',
			colorError: '#EF4444',
			colorSuccess: '#22C55E',
			textPrimary: '#0F172A',
			textSecondary: '#64748B',
			border: '#E2E8F0'
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
	{ id: 'noto-sans', name: 'Noto Sans', family: "'Noto Sans Variable', sans-serif" },
	{ id: 'inter', name: 'Inter', family: "'Inter Variable', sans-serif" },
	{ id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif" },
	{ id: 'open-sans', name: 'Open Sans', family: "'Open Sans Variable', sans-serif" },
	{ id: 'lato', name: 'Lato', family: "'Lato', sans-serif" },
	{ id: 'nunito', name: 'Nunito', family: "'Nunito Variable', sans-serif" },
	{ id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
	{ id: 'source-sans', name: 'Source Sans', family: "'Source Sans 3 Variable', sans-serif" },
	{ id: 'dm-sans', name: 'DM Sans', family: "'DM Sans Variable', sans-serif" }
] as const;

export type StyleKey = keyof typeof STYLES;
export type FontId = (typeof FONTS)[number]['id'];

export const DEFAULT_STYLE: StyleKey = 'ember';
export const DEFAULT_FONT: FontId = 'plus-jakarta-sans';
