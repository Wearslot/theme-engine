const { loadTemplateContent } = require("./src/display");
const { compileSection } = require("./src/display");
const { loadComponent, loadTemplate } = require("./src/display");
const { registerCustomHelpers } = require("./src/helpers");

module.exports = {
    loadComponent, loadTemplate, loadTemplateContent, registerCustomHelpers, compileSection
}