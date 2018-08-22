#!/usr/bin/env node
var fs = require("fs");
var pHash = require('phash-imagemagick');

let argv = new Array();
process.argv.forEach((value, index) => { if (index > 1) argv.push(value) });

let files = new Array();
filesAdd = (fileName) => {
	fileStats = fs.lstatSync(fileName);
	if (fileStats.isFile())
		files.push({ fileName: fileName });
	if (fileStats.isDirectory())
		fs.readdirSync(fileName).forEach((value) => { filesAdd(fileName + "/" + value) });
}

argv.forEach((value) => { filesAdd(value) });

let result = Promise.resolve()
files.forEach((value, index) => {
	result = result.then(() => {
		console.log(`${index / files.length * 100 | 0}%\t(${index + 1}/${files.length})\t${value.fileName}`)
		return new Promise((resolve, reject) => {
			pHash.get(value.fileName, (err, data) => {
				value.data = data;
				if (err) {
					value.err = err;
					console.log("Skip file: " + value.fileName);
				}
				resolve();
			})
		})
	})
})
result.then(() => {
	console.log("100%\t(complete)");
	console.log("============================");
});
result.then(() => {
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
result.catch((err) => {
	console.log("运行时发生错误");
	console.log(err);
	process.exit();
})
