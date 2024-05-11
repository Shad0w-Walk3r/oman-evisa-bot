import { createConnection } from 'typeorm';

import * as fs from 'fs';
import * as color from 'cli-color';

export class DatabaseService
{
	static async initialize()
	{
		try
		{
			if (fs.existsSync('./ormconfig.json'))
			{
				await createConnection();
			}
		}
		catch (e)
		{
			console.error(color.redBright(`[DatabaseService] Failed to initialize: ${e.message || e.toString()}`));
			process.exit(1);
		}

		console.log(color.cyanBright(`[DatabaseService] Successfully initialized`));
	}
}
