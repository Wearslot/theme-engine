const fs = require('fs');
const Handlebars = require('handlebars');
const { registerCustomHelpers } = require('./helpers');
const { sectionEditorMode, editorMode } = require('./editor');
const { errorPageBuild } = require('./error');

const processTemplateData = (settings) => {
    for (const key in settings) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
            var setting = settings[key];
            if (typeof setting === 'object') {
                if (setting.hasOwnProperty('type') && setting.hasOwnProperty('default')) {
                    settings[key] = setting.value || setting.default;
                } else {
                    settings[key] = processTemplateData(setting);
                }
            }
        }
    }

    return settings;
}


exports.loadTemplate = (template, data) => {
    try {

        var base_path = process.env.THEME_BASE_PATH;

        const templateSettings = JSON.parse(fs.readFileSync(`${base_path}templates/${template}.json`, 'utf8'));

        return this.loadTemplateContent(processTemplateData(templateSettings), data, template, base_path);

    } catch (error) {
        var errorResponse = Handlebars.compile(errorPageBuild);
        return errorResponse({ error: error.message, stack: error.stack })
    }
}


exports.loadTemplateContent = (templateSettings, data, template, base_path) => {

    registerCustomHelpers(data);

    var templateContents = '';

    for (const key in templateSettings.order) {
        if (Object.hasOwnProperty.call(templateSettings.sections, templateSettings.order[key])) {
            const section = templateSettings.sections[templateSettings.order[key]];

            var partialContent = fs.readFileSync(`${base_path}sections/${section.type}.html`, 'utf8');

            const sectionData = {
                ...data,
                section,
                section_name: templateSettings.order[key],
            };

            templateContents += this.compileSection(sectionData, partialContent);
        } else {
            throw new Error(`Section ${templateSettings.order[key]} not found in ${base_path}template/${template}.json`);
        }
    }

    if (process.env.THEME_EDITOR_MODE) {
        templateContents = editorMode(templateContents);
    }

    if (templateSettings.layout) {

        var layoutContent = fs.readFileSync(`${base_path}layouts/${templateSettings.layout}.html`, 'utf8');
        var layoutTemplate = Handlebars.compile(layoutContent);

        templateContents = layoutTemplate({
            ...data,
            layout: false,
            content: templateContents
        })
    }

    return templateContents;
}


exports.compileSection = (data, partialContent) => {

    if (process.env.THEME_EDITOR_MODE) {
        partialContent = sectionEditorMode(partialContent);
    }

    var template = Handlebars.compile(partialContent);
    return template(data);
}


exports.loadComponent = (name, data) => {

    registerCustomHelpers(data);

    const component = fs.readFileSync(`${process.env.THEME_BASE_PATH}components/${name}.html`, 'utf8');
    const template = Handlebars.compile(component);

    return template(data);
}

module.exports = {
    processTemplateData
}