const fs = require('fs');
const chalk = require('chalk');
const generateProjectJSON = require('./project-json-generator').generate;

(async function setup() {
    console.log(chalk.black.bgBlue(' BUILD '), 'Wallpaper Engine');

    try {
        const projectJSON = generateProjectJSON();

        copyFile('assets/' + projectJSON.preview, 'dist/' + projectJSON.preview);
        copyFile('wallpaper/Atch - Traveller.mp3', 'dist/Atch - Traveller.mp3');

        setupProjectJSON(JSON.stringify(projectJSON));
    } catch (e) {
        console.warn(e);
    }
})();

function copyFile(from, to) {
    fs.copyFileSync(from, to);
    console.log(chalk.black.bgGreen(' WRITE '), chalk.green(to));
}

function setupProjectJSON(str) {
    const jsonPath = 'dist/project.json';
    fs.writeFileSync(jsonPath, str);
    console.log(chalk.black.bgGreen(' WRITE '), chalk.green(jsonPath));
}
