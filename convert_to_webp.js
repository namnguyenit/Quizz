// convert_to_webp.js
// Converts all PNG/JPEG images in static/images/questions/ to WebP format

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const INPUT_DIR = './static/images/questions';
const QUALITY = 80;
const EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function convertToWebp() {
	console.log(`\nScanning ${INPUT_DIR} for images to convert...\n`);

	let files;
	try {
		files = await readdir(INPUT_DIR);
	} catch (err) {
		if (err.code === 'ENOENT') {
			console.error(`Directory not found: ${INPUT_DIR}`);
			console.error('Please create the directory first: mkdir -p static/images/questions');
			process.exit(1);
		}
		throw err;
	}

	const imageFiles = files.filter((f) => EXTENSIONS.includes(parse(f).ext.toLowerCase()));

	if (imageFiles.length === 0) {
		console.log('No PNG/JPEG images found to convert.');
		return;
	}

	let converted = 0;
	let skipped = 0;
	let failed = 0;

	for (const file of imageFiles) {
		const { name, ext } = parse(file);
		const inputPath = join(INPUT_DIR, file);
		const webpPath = join(INPUT_DIR, `${name}.webp`);

		// Skip if webp already exists
		try {
			await stat(webpPath);
			console.log(`⏭️  Skipped: ${file} (${name}.webp already exists)`);
			skipped++;
			continue;
		} catch {
			// webp doesn't exist, proceed with conversion
		}

		try {
			await sharp(inputPath).webp({ quality: QUALITY }).toFile(webpPath);
			console.log(`✅ Converted: ${file} → ${name}.webp`);
			converted++;
		} catch (err) {
			console.error(`❌ Failed: ${file} - ${err.message}`);
			failed++;
		}
	}

	console.log(`\n${'='.repeat(40)}`);
	console.log(`Done!`);
	console.log(`  Converted: ${converted}`);
	console.log(`  Skipped:   ${skipped}`);
	if (failed > 0) {
		console.log(`  Failed:    ${failed}`);
	}
	console.log(`${'='.repeat(40)}\n`);
}

convertToWebp().catch((err) => {
	console.error('Unexpected error:', err);
	process.exit(1);
});
