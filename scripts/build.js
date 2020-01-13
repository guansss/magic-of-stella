const fs = require('fs');
const chalk = require('chalk');
const generateProjectJSON = require('./project-json-generator').generate;

(async function setup() {
    console.log(chalk.black.bgBlue(' BUILD '), 'Wallpaper Engine');

    try {
        copyFiles('assets/preview.jpg', 'dist/preview.jpg');

        setupProjectJSON();
    } catch (e) {
        console.warn(e);
    }
})();

function copyFiles(from, to) {
    fs.copyFileSync(from, to);
    console.log(chalk.black.bgGreen(' WRITE '), chalk.green(to));
}

function setupProjectJSON() {
    const jsonPath = 'dist/project.json';
    const projectJSON = generateProjectJSON();

    fs.writeFileSync(jsonPath, projectJSON);
    console.log(chalk.black.bgGreen(' WRITE '), chalk.green(jsonPath));
}
