import { defaultPath, generatorName } from '@/globals';
import { GeneratorError, generatorHandler } from '@prisma/generator-helper';
import path from 'path';
import { version } from '../package.json';
import { generateMySqlSchema, generatePgSchema, generateSQLiteSchema } from './util/generators';
import { recursiveWrite } from './util/recursive-write';

generatorHandler({
	onManifest() {
		return {
			version,
			defaultOutput: defaultPath,
			prettyName: generatorName,
		};
	},
	onGenerate: async (options) => {
		const dbType = options.datasources[0]?.provider;

		let output: string;

		switch (dbType) {
			case 'postgres':
			case 'postgresql': {
				output = generatePgSchema(options);

				break;
			}

			case 'mysql': {
				output = generateMySqlSchema(options);

				break;
			}

			case 'sqlite': {
				output = generateSQLiteSchema(options);

				break;
			}

			case undefined:
				throw new GeneratorError('Unable to determine database type.\nMake sure datasource.provider is specified.');

			case 'mongodb':
			default:
				throw new GeneratorError(
					`Invalid database type for Drizzle schema generation: ${dbType}.\nSupported database types: PostgreSQL, MySQL, SQLite.`,
				);
		}

		const folderPath = path.resolve(
			options.generator.output?.value ?? (!!options.generator.output?.fromEnvVar
				? process.env[options.generator.output.fromEnvVar!] ?? defaultPath
				: defaultPath),
		);

		const schemaPath = folderPath.endsWith('.ts')
			? folderPath
			: path.join(folderPath, '/schema.ts');

		recursiveWrite(schemaPath, output);
	},
});
