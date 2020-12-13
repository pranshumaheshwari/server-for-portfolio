let axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");
const app = express();
const schedule = require('node-schedule');


const db = require('./models/index.js');


const port = 3000;


app.use(cors());
const rule = new schedule.RecurrenceRule();
rule.hour = 0
rule.minute = 0
schedule.scheduleJob(rule, async () => {
	const d = new Date()
	const data = await getValue()
	db.Portfolio.create({
		date: d.toUTCString(),
		value: data.totalValue
	})
})


const URL = `https://www.moneycontrol.com/mutual-funds/nav/dsp-tax-saver-fund-regular/MDS060`;

app.get("/", async (req, Res) => {
	axios
		.get(URL)
		.then((res) => res.data)
		.then((res) => {
			const $ = cheerio.load(res);
			Res.json({
				data: [
					{
						nav: parseFloat($("span[class=amt]").text().substr(2, 6)),
					},
				],
				status: "SUCCESS",
			});
		});
});

app.get("/oldValue", async (req, res) => {
	const data = await db.Portfolio.findOne({
		order: [
			['createdAt', 'DESC']
		]
	})
	res.json(data)
})

app.get("/value", async (req, res) => {
	res.json(await getValue())
});

const getValue = async () => {
	const URL = [
		`https://api.mfapi.in/mf/146127`,
		`https://server-for-portfolio.herokuapp.com`,
	];
	const alternateURL = `https://www.quandl.com/api/v3/datasets/AMFI/146127.json`;

	const units = [
		[1473.477, 1428.571, 979.432, 1990.05],
		[216.296, 291.7834],
	];
	const totalUnits = units.map((a) => a.reduce((r, v) => r + v, 0));
	const startDate = [
		[
			new Date("March 10, 2019"),
			new Date("May 28, 2019"),
			new Date("June 06, 2019"),
			new Date("July 02, 2019"),
		],
		[new Date("August 21, 2019"), new Date("November 07, 2019")],
	];
	const startNAV = [
		[10.18, 10.5, 10.21, 10.05],
		[46.233, 51.408],
	];
	const startValue = startNAV.map((a, i) =>
		Math.round(a.reduce((r, a, j) => r + a * units[i][j], 0))
	);
	const totalStartValue = startValue.reduce((r, a) => r + a, 0);
	var totalCurrentValue = 0,
		currentValue = [],
		currentNAV = [];

	let calculate = await (async (_) => {
		for (const i in URL) {
			await axios
				.get(URL[i])
				.then((res) => res.data)
				.then((res) => {
					if (res.status !== "SUCCESS") {

					} else {
						var currentStats = res.data[0];
						currentStats.nav = Math.round(currentStats.nav * 100) / 100;
						currentNAV.push(currentStats.nav);
						currentStats.value =
							Math.round(totalUnits[i] * currentStats.nav * 100) / 100;
						totalCurrentValue += currentStats.value;
						currentValue.push(currentStats.value);
					}
				});
		}
	})();
	
	return {
		currentValue,
		currentNAV,
		totalValue: currentValue.reduce((accumalator, currentValue) => accumalator + currentValue)
	}
}

app.listen(process.env.PORT || port, () =>
	console.log(`App listening on port ${port}!`)
);
