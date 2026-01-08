import { readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const db = createClient({
	url: process.env.TURSO_URL,
	authToken: process.env.TURSO_AUTH_TOKEN
});

function parseQuizContent(filePath) {
	const content = readFileSync(filePath, 'utf8');
	return JSON.parse(content);
}

async function run() {
	try {
		console.log('Cleaning existing tables...');
		await db.execute(`DROP TABLE IF EXISTS questions`);
		await db.execute(`DROP TABLE IF EXISTS quiz_collections`);
		await db.execute(`DROP TABLE IF EXISTS subjects`);

		console.log('Creating new tables...');
		await db.execute(`
      CREATE TABLE subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        description TEXT
      )
    `);

		await db.execute(`
      CREATE TABLE quiz_collections (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        name TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `);

		await db.execute(`
      CREATE TABLE questions (
        question_id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        answers TEXT NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (collection_id) REFERENCES quiz_collections(id)
      )
    `);

		const subjectsDir = 'subjects';
		const subjectFolders = readdirSync(subjectsDir).filter((f) =>
			statSync(join(subjectsDir, f)).isDirectory()
		);

		for (const subjectId of subjectFolders) {
			const subjectPath = join(subjectsDir, subjectId);
			const infoPath = join(subjectPath, 'subjectInfo.json');

			let subjectInfo = { name: subjectId, order: 0, description: '' };
			if (readdirSync(subjectPath).includes('subjectInfo.json')) {
				subjectInfo = JSON.parse(readFileSync(infoPath, 'utf8'));
			}

			console.log(`Syncing Subject: ${subjectInfo.name} (${subjectId})`);

			await db.execute({
				sql: 'INSERT INTO subjects (id, name, display_order, description) VALUES (?, ?, ?, ?)',
				args: [subjectId, subjectInfo.name, subjectInfo.order || 0, subjectInfo.description || '']
			});

			const quizFiles = readdirSync(subjectPath).filter(
				(f) => f.endsWith('.json') && f !== 'subjectInfo.json'
			);

			for (const file of quizFiles) {
				const quizPath = join(subjectPath, file);
				const ext = extname(file);
				const fileName = basename(file, ext);

				const match = fileName.match(/^(\d+)-(.*)$/);
				const displayOrder = match ? parseInt(match[1], 10) : 0;
				const quizName = match ? match[2].replace(/-/g, ' ') : fileName.replace(/-/g, ' ');
				const collectionId = `${subjectId}-${fileName}`;

				console.log(`  Syncing Quiz: ${quizName} (${collectionId})`);

				await db.execute({
					sql: 'INSERT INTO quiz_collections (id, subject_id, name, display_order) VALUES (?, ?, ?, ?)',
					args: [collectionId, subjectId, quizName, displayOrder]
				});

				const questions = parseQuizContent(quizPath);
				for (const q of questions) {
					await db.execute({
						sql: 'INSERT INTO questions (question_id, collection_id, question_text, question_type, answers, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
						args: [
							q.question_id,
							collectionId,
							q.question_text,
							q.question_type,
							JSON.stringify(q.answers),
							q.image_url || null,
							'active'
						]
					});
				}
			}
		}

		console.log('Sync complete!');
	} catch (err) {
		console.error('Sync failed:', err);
		process.exit(1);
	}
}

run();
