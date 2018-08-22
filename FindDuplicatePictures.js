#!/usr/bin/env node
var fs = require("fs");
var pHash = require('phash-imagemagick');

let files = new Array();
for (let i = 2; i < process.argv.length; i++) {
	let fileName = process.argv[i];
	if (fs.lstatSync(fileName).isFile())
		files.push({ fileName: fileName });
}

let result = Promise.resolve()
files.forEach((val, index) => {
	result = result.then(() => {
		console.log(`${index / files.length * 100 | 0}%\t(${index + 1}/${files.length})\t${val.fileName}`)
		return new Promise((resolve, reject) => {
			pHash.get(val.fileName, (err, data) => {
				val.data = data;
				if (err)
				{
					val.err = err;
					console.log("Skip file: " + val.fileName);
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
	files.forEach((val1, index1) => {
		files.forEach((val2, index2) => {
			if (index1 < index2 && !val1.err && !val2.err) {
				if (pHash.eq(val1.data, val2.data)) {
					console.log(val2.fileName);
				}
			}
		})
	})
})
result.catch((err) => {
	console.log("失败");
	console.log(err);
	process.exit();
})