#!/usr/bin/env node
var fs = require("fs");
var pHash = require('phash-imagemagick');
var os = require('os');

let argv = new Array();
process.argv.forEach((value, index) => { if (index > 1) argv.push(value) });

let files = new Array();
let filesCompleted = 0;
filesAdd = (fileName) => {
	fileStats = fs.lstatSync(fileName);
	if (fileStats.isFile())
		files.push({ fileName: fileName });
	if (fileStats.isDirectory())
		fs.readdirSync(fileName).forEach((value) => { filesAdd(fileName + (fileName.charAt(fileName.length - 1) == '/' ? '' : '/') + value) });
}
argv.forEach((value) => { filesAdd(value) });

let progressBarUpdate = () => {
	let progress = filesCompleted / files.length;
	let progressText = (100 * progress).toFixed(2).toString();
	let progressBarLen = 100;
	let progressBarText = '';
	while (progressText.length < 6)
		progressText = ' ' + progressText;
	progressBarText += ` ${progressText}% `;
	for (let i = 0; i < progress * progressBarLen; i++) {
		progressBarText += '█';
	}
	for (var i = progress * progressBarLen; i < progressBarLen; i++) {
		progressBarText += '░';
	}
	progressBarText += ` (${filesCompleted}/${files.length})\r`;
	process.stdout.write(progressBarText);
}

let numCPUs = os.cpus().length;
let resultMain = Promise.resolve();
let results = new Array();
let resultsCompleted = 0;
for (let i = 0; i < numCPUs; i++) {
	let result = Promise.resolve();
	results.push(result);
	files.forEach((value, index) => {
		result = result.then(() => {
			if (!value.lock) {
				value.lock = true;
				return new Promise((resolve, reject) => {
					pHash.get(value.fileName, (err, data) => {
						value.data = data;
						if (err) {
							value.err = err;
							console.log("Skip file: " + value.fileName + "\033[K");
							progressBarUpdate();
						}
						filesCompleted++;
						resolve();
					})
				})
			}
			else {
				return Promise.resolve();
			}
		})
	})
	result.then(() => {
		resultsCompleted++;
	});
}

resultMain = resultMain.then(() => {
	return new Promise((resolve, reject) => {
		let checkCompleted = () => {
			progressBarUpdate();
			if (resultsCompleted >= results.length && filesCompleted >= files.length) {
				process.stdout.write("\n");
				resolve();
			}
			else {
				setTimeout(checkCompleted, 500);
			}
		}
		checkCompleted();
	})
})
resultMain.then(() => {
	for (let index1 = 0; index1 < files.length; index1++) {
		for (let index2 = index1 + 1; index2 < files.length; index2++) {
			let value1 = files[index1];
			let value2 = files[index2];
			if (!value1.err && !value2.err && !value1.exclude && !value2.exclude) {
				let diff = pHash.compare(value1.data, value2.data);
				if (diff < 0.005) {
					value2.exclude = true;
					console.log(`${value2.fileName} is duplicate with ${value1.fileName} value ${diff}%`);
				}
			}
		}
	}
})
resultMain.catch((err) => {
	console.log("运行时发生错误");
	console.log(err);
	process.exit();
})
