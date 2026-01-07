// Local storage keys and types for app state

export const APP_VERSION_KEY = 'app_version';
export const CURRENT_VIEW_KEY = 'currentView';
export const FAVORITE_QUESTIONS_KEY = 'favoriteQuestions';
export const APPSTATE_ALL_KEY = 'appState_all';
export const FAVORITES_LOCAL_KEY = 'appState_favorites';
export const STYLE_KEY = 'app_style';
export const FONT_KEY = 'app_font';

export interface FavoritesLocalState {
	module: string;
	questionIndex: number;
}

export const DEFAULT_FAVORITES_LOCAL: FavoritesLocalState = {
	module: 'all',
	questionIndex: 0
};
export interface AppStateAll {
	modules: string[];
	currentIndex: number;
}

export const DEFAULT_APPSTATE_ALL: AppStateAll = {
	modules: ['all'],
	currentIndex: 0
};
