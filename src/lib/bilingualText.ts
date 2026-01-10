/**
 * Utility functions for parsing bilingual (English/Vietnamese) text
 * Supports multiple formats:
 * - "\nVN:" delimiter
 * - " / " slash delimiter
 * - "(Vietnamese)" parentheses
 */

export interface BilingualParts {
	english: string;
	vietnamese: string;
}

/**
 * Check if text contains Vietnamese characters
 */
function hasVietnameseChars(text: string): boolean {
	// Vietnamese-specific diacritics pattern
	return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
}

/**
 * Parse text using " / " slash delimiter
 */
function parseWithSlash(text: string): BilingualParts | null {
	const slashIndex = text.indexOf(' / ');
	if (slashIndex === -1) return null;

	const firstPart = text.slice(0, slashIndex).trim();
	const secondPart = text.slice(slashIndex + 3).trim();

	if (!firstPart || !secondPart) return null;

	// Determine which part is Vietnamese based on characters
	if (hasVietnameseChars(secondPart) && !hasVietnameseChars(firstPart)) {
		return { english: firstPart, vietnamese: secondPart };
	} else if (hasVietnameseChars(firstPart) && !hasVietnameseChars(secondPart)) {
		return { english: secondPart, vietnamese: firstPart };
	} else if (hasVietnameseChars(secondPart)) {
		// Both have Vietnamese or neither, assume English first
		return { english: firstPart, vietnamese: secondPart };
	}

	return null;
}

/**
 * Parse text using parentheses for Vietnamese
 * Format: "English text (Vietnamese text)"
 * Handles nested parentheses by finding the matching opening paren
 */
function parseWithParentheses(text: string): BilingualParts | null {
	// Trim to handle trailing whitespace
	const trimmed = text.trim();

	// Must end with closing paren
	if (!trimmed.endsWith(')')) return null;

	// Find the matching opening parenthesis by counting from the end
	let depth = 0;
	let matchingOpenIndex = -1;

	for (let i = trimmed.length - 1; i >= 0; i--) {
		const char = trimmed[i];
		if (char === ')') {
			depth++;
		} else if (char === '(') {
			depth--;
			if (depth === 0) {
				matchingOpenIndex = i;
				break;
			}
		}
	}

	if (matchingOpenIndex <= 0) return null;

	const english = trimmed.slice(0, matchingOpenIndex).trim();
	const vietnamese = trimmed.slice(matchingOpenIndex + 1, trimmed.length - 1).trim();

	if (!english || !vietnamese) return null;

	// Verify the parentheses content looks like Vietnamese
	if (hasVietnameseChars(vietnamese)) {
		return { english, vietnamese };
	}

	return null;
}

/**
 * Parse question text that may use multiple formats:
 * - "\nVN:" delimiter
 * - " / " slash delimiter
 * - "(Vietnamese)" parentheses
 */
export function parseQuestionText(text: string): BilingualParts {
	if (!text) return { english: '', vietnamese: '' };

	// Try "\nVN:" format first
	const vnMarker = '\nVN:';
	const vnMarkerAlt = '\nVN: ';

	let splitIndex = text.indexOf(vnMarkerAlt);
	let markerLength = vnMarkerAlt.length;

	if (splitIndex === -1) {
		splitIndex = text.indexOf(vnMarker);
		markerLength = vnMarker.length;
	}

	if (splitIndex !== -1) {
		const english = text.slice(0, splitIndex).trim();
		const vietnamese = text.slice(splitIndex + markerLength).trim();
		return { english, vietnamese };
	}

	// Try " / " slash format
	const slashResult = parseWithSlash(text);
	if (slashResult) return slashResult;

	// Try parentheses format
	const parenResult = parseWithParentheses(text);
	if (parenResult) return parenResult;

	// No bilingual format found, treat entire text as primary (Vietnamese)
	return { english: '', vietnamese: text };
}

/**
 * Parse answer text that may use multiple formats:
 * - "(Vietnamese)" parentheses
 * - " / " slash delimiter
 */
export function parseAnswerText(text: string): BilingualParts {
	if (!text) return { english: '', vietnamese: '' };

	// Try parentheses format first
	const parenResult = parseWithParentheses(text);
	if (parenResult) return parenResult;

	// Try " / " slash format
	const slashResult = parseWithSlash(text);
	if (slashResult) return slashResult;

	// No bilingual format found, treat entire text as-is
	return { english: '', vietnamese: text };
}
