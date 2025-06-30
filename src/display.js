const fs = require('fs');
const Handlebars = require('handlebars');
const { registerCustomHelpers } = require('./helpers');
const { sectionEditorMode, editorMode, templateMode, previewMode } = require('./editor');
const { errorPageBuild } = require('./error');
const { processTemplateData } = require('./utils');


exports.loadTemplate = (name, settings, data) => {
    try {

        var base_path = process.env.THEME_BASE_PATH;

        var templateContents = this.loadTemplateContent(processTemplateData(settings), data, name, base_path);
        if (process.env.THEME_EDITOR_MODE) {
            templateContents = editorMode(templateContents);
        } else if (process.env.THEME_PREVIEW_MODE) {
            templateContents = previewMode(templateContents);
        }

        if (settings.layout) {

            var layoutContent = fs.readFileSync(`${base_path}layouts/${settings.layout}.handlebars`, 'utf8');
            var layoutTemplate = Handlebars.compile(layoutContent);

            templateContents = layoutTemplate({
                ...data,
                layout: false,
                content: templateContents
            })
        }

        return templateContents;

    } catch (error) {
        throw error;
    }
}


exports.loadTemplateContent = (settings, data, name, base_path) => {

    registerCustomHelpers(data);

    var templateContents = '';

    for (const key in settings.order) {
        if (Object.hasOwnProperty.call(settings.sections, settings.order[key])) {
            const section = settings.sections[settings.order[key]];

            var partialContent = fs.readFileSync(`${base_path}sections/${section.type}.handlebars`, 'utf8');

            const sectionData = {
                ...data,
                section,
                section_name: settings.order[key],
            };

            templateContents += this.compileSection(sectionData, partialContent);
        } else {
            throw new Error(`Section ${settings.order[key]} not found in template/${name}.json`);
        }
    }

    if (process.env.THEME_EDITOR_MODE) {
        templateContents = templateMode(templateContents);
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

    const component = fs.readFileSync(`${process.env.THEME_BASE_PATH}components/${name}.handlebars`, 'utf8');
    const template = Handlebars.compile(component);

    return template(data);
}