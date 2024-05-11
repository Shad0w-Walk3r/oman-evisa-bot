import 'dotenv/config';
import { default as axios } from 'axios';
import * as color from 'cli-color';
import * as cheerio from 'cheerio';
import { QueryFailedError } from 'typeorm';

import { DatabaseService } from './services/database.service';
import { VisaApplication } from './entities/visa-application.entity';
import { Gender } from './enums/gender.enum';
import { VisaStatus } from './enums/visa-status.enum';

global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchVisaDetails(visaNumber)
{
	try
	{
		const response = await axios.get(`https://evisa.rop.gov.om/en/track-your-application?visaNumber=${visaNumber}`,
		{
			validateStatus: (status) => status === 200
		});

		const $ = cheerio.load(response.data);

		if ($('.portlet-msg-error').length > 0)
		{
			console.warn(color.yellowBright(`[!] Failed to fetch visa details #${visaNumber}: ${$('.portlet-msg-error').text().trim()}`));
			return;
		}

		if ($('.section-qr').length > 0)
		{
			const statusText = $('.col-lg-12.text-center > .sub_ttl').text().trim();
			const statusChangedDate = $('.col-lg-12 .fw-bold').text().trim()?.split('-')?.reverse()?.join('-');

			const application = new VisaApplication();
			application.visa_number = visaNumber;
			application.visa_status = statusText.includes('Active') ? VisaStatus.Active : statusText.includes('Expired') ? VisaStatus.Expired : VisaStatus.Cancelled;
			application.active = application.visa_status === VisaStatus.Active;
			application.visa_last_changed_at = statusChangedDate ? new Date(statusChangedDate) : null;

			$('.qr-content').find('p.mb-0').each((index, element) =>
			{
				const columnName = $(element).text().trim();
				const dataValue = $(element).next('p.mb-2').text().trim();

				switch (columnName)
				{
					case 'Given Name':
						application.first_name = dataValue || null;
						break;
					case 'Family Name':
						application.last_name = dataValue || null;
						break;
					case 'Gender':
						application.gender = dataValue === 'Male' ? Gender.Male : Gender.Female;
						break;
					case 'Nationality':
						application.nationality = dataValue || null;
						break;
					case 'Travel Document Number':
						application.passport_number = dataValue || null;
						break;
					case 'Travel Document Expiry Date':
						application.passport_expires_at = dataValue ? new Date(dataValue.split('-').reverse().join('-')) : null;
						break;
				}
			});

			await application.save();

			console.log(color.cyanBright(`[+] Added Visa #${visaNumber} to DataBase -> ${application.first_name} ${application.last_name} (${application.nationality}) -> ${application.visa_status}`));
		}
	}
	catch (error)
	{
		if (error instanceof QueryFailedError && error.message.includes('Duplicate entry'))
		{
			console.warn(`[!] Duplicate entry error for Visa Number #${visaNumber}\tSkipping...`);
			await global.sleep(100);
			return;
		}

		console.error(color.redBright(`[!] Failed to fetch visa details #${visaNumber}: ${error.toString()}\tRetrying...`));
		await global.sleep(100);

		// Retry fetching visa details
		await fetchVisaDetails(visaNumber);
	}
}

async function bootstrap()
{
	await DatabaseService.initialize();

	const lastRecord = await VisaApplication.findOne({ where: {}, order: { visa_number: 'DESC' } });
	const startVisaNumber = lastRecord ? lastRecord.visa_number + 1 : 0;

	const endVisaNumber = 9999999999;
	const concurrencyLimit = 50; // Adjust the concurrency limit as needed

	await processVisaNumbers(startVisaNumber, endVisaNumber, concurrencyLimit);

	console.log(color.greenBright('[Bootstrap] Application has been initialized'));

	process.on('uncaughtException', async (error) =>
	{
		console.log(color.redBright(`[UncaughtException] ${error.name}: ${error.message} at ${error.stack}`));
	});
}

async function processVisaNumbers(startVisaNumber, endVisaNumber, concurrencyLimit)
{
	let currentVisaNumber = startVisaNumber;

	while (currentVisaNumber < endVisaNumber)
	{
		const visaNumbers = Array.from({ length: concurrencyLimit }, (_, i) => currentVisaNumber + i);
		await Promise.all(visaNumbers.map(visaNumber => fetchVisaDetails(visaNumber)));
		currentVisaNumber += concurrencyLimit;
	}
}

bootstrap();
