const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const config = dotenv.config();

if (config.error) {
	throw config.error;
}

const result = config.parsed;

const err = {
	emptyFFMPEG: "empty .env FFMPEG",
	noentFFMPEG: "no such file or directory: " + result.FFMPEG,
};

try {
	if (!result.FFMPEG) throw err.emptyFFMPEG;

	const ff = path.normalize(result.FFMPEG);
	if (ff === "." || !fs.existsSync(ff)) throw err.noentFFMPEG;
	result.FFMPEG = ff;

	module.exports = result;
} catch (e) {
	console.error("[fatal]", e);
	process.exit();
}
