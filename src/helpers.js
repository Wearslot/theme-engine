const fs = require('fs');
const Handlebars = require('handlebars');
const { sectionEditorMode, widgetEditorMode } = require('./editor');


exports.registerCustomHelpers = (data) => {

    // Layout & view helpers

    /**
     * Loads the content from a specified filename located inside the 
     * theme sections folder
     * 
     * @params `name` of the filename needed to be rendered.
     */
    Handlebars.registerHelper('render', function (name, options) {

        const sectionData = { ...data, ...options.hash };

        const component = fs.readFileSync(`${process.env.THEME_BASE_PATH}sections/${name}.html`, 'utf8');
        const template = Handlebars.compile(component);

        return template({ ...this, ...sectionData });
    });

    /**
     * Loads the content from a specified filename located inside the 
     * components folder
     * 
     * @params `name` of the filename needed to be rendered
     * @params ?`options`
     */
    Handlebars.registerHelper('component', function (name, options) {

        const componentData = { ...data, ...options.hash };
        const component = fs.readFileSync(`${process.env.THEME_BASE_PATH}components/${name}.html`, 'utf8');
        const template = Handlebars.compile(component);

        return template({ ...this, ...componentData });
    });

    /**
     * Takes a spcified configration json file located inside the sections folder
     * and performs the compilation 
     * 
     * @params `name` of the filename needed to be rendered
     */
    Handlebars.registerHelper('sections', function (name, options) {

        const groupedSectionData = { ...data, ...options.hash };

        const sectionSettings = JSON.parse(fs.readFileSync(`${process.env.THEME_BASE_PATH}sections/${name}.json`, 'utf8'));

        var groupContents = '';

        for (const key in sectionSettings.order) {
            if (Object.hasOwnProperty.call(sectionSettings.sections, sectionSettings.order[key])) {
                const section = sectionSettings.sections[sectionSettings.order[key]];

                if (section.settings?.show !== false) {
                    var partialContent = fs.readFileSync(`${process.env.THEME_BASE_PATH}sections/${section.type}.html`, 'utf8');

                    if (process.env.THEME_EDITOR_MODE) {
                        partialContent = sectionEditorMode(partialContent);
                    }

                    var template = Handlebars.compile(partialContent);

                    groupContents += template({
                        ...this,
                        section,
                        section_id: key,
                        section_name: sectionSettings.order[key],
                        group_name: name,
                        ...groupedSectionData
                    });
                }
            } else {
                throw new Error(`Section ${sectionSettings.order[key]} not found in ${process.env.THEME_BASE_PATH}sections/${name}.json`);
            }
        }

        var template = Handlebars.compile(groupContents);
        return template(groupedSectionData);
    });

    /**
     * Defines an iteration widget block for theme contents and settings from the template,
     * performs the compilation and enable editor settings
     * 
     * @params `section.widgets` to be iterated
     * 
     */
    Handlebars.registerHelper('widgets', function (widgets, options) {

        if (typeof widgets !== 'object' && !Array.isArray(widgets)) {
            return `Invalid settings for section widgets ${widgets}.`;
        }

        let result = ''

        var variable = 'widget';
        if (options.hash.as !== undefined) {
            variable = options.hash.as;
        }

        for (var name in widgets) {
            var widget = widgets[name];

            var widgetResult = options.fn({
                [variable]: widget,
                ...data
            });

            if (process.env.THEME_EDITOR_MODE) {
                var widget = Handlebars.compile(widgetEditorMode(widgetResult, name, widget));
                result += widget({ ...data, ...this });
                continue;
            }

            result += widgetResult;
        }

        return result;
    });


    /**
     * Create a widget block theme contents and settings from the template,
     * performs the compilation and enable editor settings
     * 
     * @params `widget`
     * 
     */
    Handlebars.registerHelper('widget', function (options) {

        if (!options.hash.name || !options.hash.widget) {
            return "Name and widget parameters are required for widgets";
        }

        if (typeof options.hash.widget !== 'object')
            return `Invalid widget ${widget}.`;

        var variable = 'widget';
        if (options.hash.as !== undefined) {
            variable = options.hash.as;
        }

        var result = options.fn({
            [variable]: options.hash.widget,
            ...data
        });

        if (process.env.THEME_EDITOR_MODE) {
            var widget = Handlebars.compile(widgetEditorMode(result, options.hash.name, options.hash.widget));
            result = widget({ ...data, ...this });
        }

        return result;
    });


    /**
     * Resolves variable data specified in the settings file
     * and return the actual value 
     * 
     * @params `variable` the data to be render.
     */
    Handlebars.registerHelper('resolve', function (variable) {
        if (variable.indexOf('.') > -1) {
            var chain = variable.split('.');
            var value = data[chain[0]];
            for (let i = 1; i < chain.length; i++) {
                if (!value.hasOwnProperty(chain[i])) return null;
                value = value[chain[i]];
            }

            return value;
        }

        return data[variable];
    });


    // Control flow helpers

    /**
     * checks an if an expression is true and then execute the block on code
     * inside the condition block.
     * 
     * @params `value1` 
     * @params `operator`<string> 
     * @params `value2` 
     */
    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
        const dData = { ...this, ...data };
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(dData) : options.inverse(dData);
            case '===':
                return (v1 === v2) ? options.fn(dData) : options.inverse(dData);
            case '!=':
                return (v1 != v2) ? options.fn(dData) : options.inverse(dData);
            case '!==':
                return (v1 !== v2) ? options.fn(dData) : options.inverse(dData);
            case '<':
                return (v1 < v2) ? options.fn(dData) : options.inverse(dData);
            case '<=':
                return (v1 <= v2) ? options.fn(dData) : options.inverse(dData);
            case '>':
                return (v1 > v2) ? options.fn(dData) : options.inverse(dData);
            case '>=':
                return (v1 >= v2) ? options.fn(dData) : options.inverse(dData);
            case '&&':
                return (v1 && v2) ? options.fn(dData) : options.inverse(dData);
            case '||':
                return (v1 || v2) ? options.fn(dData) : options.inverse(dData);
            default:
                return options.inverse(dData);
        }
    });

    /**
     * checks it the value of the varible is false and then it executes the
     * line of code in between the block.
     * 
     * @params `value` <any>
     */
    Handlebars.registerHelper('unless', function (v1, options) {
        const dData = { ...this, ...data };
        return (Boolean(v1) === false) ? options.fn(dData) : options.inverse(dData);
    });

    /**
     * checks if an item is in list
     * 
     * @params `list` <array|data-object>
     * @params `item` <any>
     */
    Handlebars.registerHelper('includes', function (collection, item, options) {

        if (typeof collection !== 'object' && !Array.isArray(collection)) {
            return (`Invalid list value ${collection} on includes.`);
        }

        if (collection.data !== undefined) {
            collection = collection.data;
        }

        if (Array.isArray(collection) && collection.includes(item)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    /**
     * To loops over an list
     * 
     * @params `list` <array|data-object>
     * 
     * To limit or set the number of iteration - limit=<number>
     * To specify the variable name for every iteration - as=<string> default is current
     * 
     * To access the index of the current item
     * use `index` or `current.index` if the collection is a list of object 
     */
    Handlebars.registerHelper('iterate', function (collection, options) {

        if (typeof collection !== 'object' && !Array.isArray(collection)) {
            return `Invalid array|list value ${collection} on iterate.`;
        }

        var ItemsList = collection;

        if (collection.data !== undefined) {
            ItemsList = collection.data;
        }

        var limit = collection.length;
        if (typeof options.hash.limit !== 'undefined') {
            limit = options.hash.limit;
        }

        let result = ''

        var variable = 'current';
        if (options.hash.as !== undefined) {
            variable = options.hash.as;
        }

        let i = 0;
        for (var key in ItemsList) {
            item = ItemsList[key];
            if (typeof item === 'object') {
                item['index'] = i;
            }

            result += options.fn({
                [variable]: item,
                index: i, ...data
            });

            i++;
        }

        return result;
    });


    /**
     * To render a pagination items
     * 
     * @params `pagination` <object>
     * 
     * To add custom styles to the next button - next=<string>
     * To add custom styles to the previous button - previous=<string>
     * To specify number of buttons to be display at one - limit=<number>
     * 
     * e.g {{#pagination products }} .... {{/pagination}}
     */
    Handlebars.registerHelper("pagination", function (pagination, options) {

    });

    /**
     * To get an item in an array list using the index of the item
     * 
     * @params `list` <array>
     * @package `index` <integer>
     */
    Handlebars.registerHelper('item', function (list, index) {
        if (!Array.isArray(list)) {
            return (`Invalid array|list value ${list} on item.`);
        }
        return list[index];
    });

    /**
     * To check if a product is already in cart
     * 
     * @params `product` <object>
     */
    Handlebars.registerHelper('inCart', function (product, options) {
        const search = data.cart.items.find((item) => {
            if (product.id !== item.product_id) {
                return false;
            }

            if (!item.has_default_or_selected_variant) {
                return true;
            }

            if (product.default_or_selected_variant_id !== item.variant.id) {
                return false;
            }

            return true;
        });


        if (!search) {
            return options.inverse(this);
        }

        return options.fn({ ...data, item: search });
    })

    /**
      * To loops over a product variation group
      * 
      * @params `product` <object>
      */
    Handlebars.registerHelper('variations', function (product, options) {
        // Access the variations key within the product object
        const variations = product.variations;

        // Iterate over the variations and execute the block for each variation
        let result = '';
        for (let i = 0; i < variations.length; i++) {
            result += options.fn({ ...this, ...variations[i], product });
        }
        return result;
    });

    /**
      * To loops over the list of variation options in a variation group
      * used as a nexted loop inside the `variations` helper.
      * 
      * @params `varition_options` <object>
      */
    Handlebars.registerHelper('variantOptions', function (variantOption, options) {
        // Iterate over the variations and execute the block for each variation
        let result = '';
        for (let i = 0; i < variantOption.values.length; i++) {
            result += options.fn({ ...this, ...variantOption.values[i], product: variantOption.product });
        }
        return result;
    });

    // Register a form helpers

    /**
     * To open an action form tag
     * 
     * @params `form_key` <string> - product, search, newsletter, review, apply-coupon, remove-coupon, remove-item
     * @params `props` <string> - attributes such as class, id and others
     */
    Handlebars.registerHelper('form', function (form_key, props, options) {

        var form = null;

        if (typeof props !== 'string' && options === undefined) {
            options = props;
            props = '';
        }

        switch (form_key) {
            case "newsletter":
                form = `<form form-id="newsletter_form" action="/newsletter" method="POST" ${props}>`
                break;

            case "search":
                form = `<form form-id="search_form" action="/search" method="GET" ${props}>`
                break;

            case "remove-item":
                form = `<form form-id="remove_item_form" action="/cart/update" method="POST" ${props}> 
                            <input type="hidden" name="line" value="${(options.hash.item.index + 1)}">
                            <input type="hidden" name="quantity" value="0">`
                break;

            case "product":
                form = `<form form-id="product_form" action="/cart/add" method="POST" ${props}> 
                            <input type="hidden" name="product_id" value="${options.hash.product.id}">`
                break;

            case "review":
                form = `<form form-id="review_form" action="/review/add" method="POST" ${props}> 
                            <input type="hidden" name="product_id" value="${options.hash.product.id}">`
                break;

            case "apply-coupon":
                form = `<form form-id="coupon_apply_form" action="/discount/apply" method="POST" ${props}>`;
                break;

            case "remove-coupon":
                form = `<form form-id="coupon_remove_form" action="/discount/remove" method="POST" ${props}>`;
                break;

            case "contact":
                form = `<form form-id="contact_form" action="/contact" method="POST" ${props}>`;
                break;

            default:
                break;
        }

        return `${form}${options.fn({ ...data })}</form>`;
    });


    Handlebars.registerHelper('country_select_field', function (props, options) {
        var result = '';

        if (typeof props === 'object') {
            options = props;
        }

        result = `<select name="${options.hash.name || 'country'}" select-id="country" ${typeof props === 'string' ? props : ''} ${process.env.THEME_EDITOR_MODE ? 'disabled' : ''}>`;
        result += `<option value=''>Select Country</option>`
        if (data.countries) {
            data.countries.forEach(country => {
                result += `<option value='${country.name}'`;
                if (options.hash.selected !== undefined) {
                    if (options.hash.selected === country.name) {
                        result += ` selected`
                    }
                }
                result += `>${country.name}</option>`
            });
        }

        result += `</select>`;
        return result;
    });

    Handlebars.registerHelper('state_select_field', function (props, options) {
        var result = '';

        if (typeof props === 'object') {
            options = props;
        }

        result = `<select name="${options.hash.name || 'state'}" select-id="state" ${typeof props === 'string' ? props : ''} ${process.env.THEME_EDITOR_MODE ? 'disabled' : ''}>`;
        result += `<option value=''>Select State</option>`;
        if (data.states) {
            data.states.forEach(state => {
                result += `<option value='${state.name}'`;
                if (options.hash.selected !== undefined) {
                    if (options.hash.selected === state.name) {
                        result += ` selected`
                    }
                }
                result += `>${state.name}</option>`
            });
        }

        result += `</select>`;
        return result;
    });
    // end form helpers

    Handlebars.registerHelper('styles', function (options) {
        return `<style type="text/css">${options.fn({ ...data })}</style>`;
    });

    Handlebars.registerHelper('script', function (options) {
        return `<script type="text/javascript">${options.fn({ ...data })}</script>`;
    });

    Handlebars.registerHelper('money', function (amount) {
        amount = String(amount).indexOf('.') > -1 ? amount : Number(amount).toFixed(2);
        return data.currency.symbol + amount;
    });

    Handlebars.registerHelper('percentage', function (value) {
        return value + '%';
    });

    Handlebars.registerHelper('product_price', function (product) {
        var price = data.currency.symbol + product.price;

        if (product.actual_price != product.price) {
            price += `<strike style="margin-left:10px;">${data.currency.symbol + product.actual_price}</strike>`
        }

        return price;
    });

    Handlebars.registerHelper('add', function (v1, v2) {
        return Number(v1) + Number(v2);
    })

    Handlebars.registerHelper('subtract', function (v1, v2) {
        return Number(v1) - Number(v2);
    })

    Handlebars.registerHelper('json', function (data) {
        return JSON.stringify(data);
    });

    Handlebars.registerHelper('clean', function (text) {
        return text.split(/[\s-_]+/).map(n => n.charAt(0).toUpperCase() + n.substring(1, n.length)).join(' ');
    });
}

