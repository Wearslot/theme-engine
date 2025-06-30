exports.processTemplateData = (settings) => {
    for (const key in settings) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
            var setting = settings[key];
            if (typeof setting === 'object') {
                if (setting.hasOwnProperty('type') && (setting.hasOwnProperty('default') || setting.hasOwnProperty('value'))) {
                    settings[key] = setting.value || setting.default;
                } else {
                    settings[key] = this.processTemplateData(setting);
                }
            }
        }
    }

    return settings;
}