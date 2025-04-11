const fs = require('fs');
const Handlebars = require('handlebars');
const { sectionEditorMode, widgetEditorMode, groupEditorMode } = require('./editor');

const errorDisplay = (message) => {
    return process.env.APP_ENV === 'development' ? message : '';
}

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

        const component = fs.readFileSync(`${process.env.THEME_BASE_PATH}sections/${name}.handlebars`, 'utf8');
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
        const component = fs.readFileSync(`${process.env.THEME_BASE_PATH}components/${name}.handlebars`, 'utf8');
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

        let groupContents = '';
        let sectionSettings = JSON.parse(fs.readFileSync(`${process.env.THEME_BASE_PATH}sections/${name}.json`, 'utf8'));

        if (process.env.THEME_EDITOR_MODE && data[name] !== undefined) {
            sectionSettings = data[name];
        }

        if (sectionSettings) {
            for (const key in sectionSettings.order) {
                if (Object.hasOwnProperty.call(sectionSettings.sections, sectionSettings.order[key])) {
                    const section = sectionSettings.sections[sectionSettings.order[key]];

                    if (section.settings?.show !== false) {
                        var partialContent = fs.readFileSync(`${process.env.THEME_BASE_PATH}sections/${section.type}.handlebars`, 'utf8');

                        if (process.env.THEME_EDITOR_MODE) {
                            partialContent = sectionEditorMode(partialContent);
                        }

                        var template = Handlebars.compile(partialContent);

                        groupContents += template({
                            ...this,
                            ...groupedSectionData,
                            section,
                            section_id: key,
                            section_name: sectionSettings.order[key],
                            group_name: name,
                        });
                    }
                } else {
                    throw new Error(`Section ${sectionSettings.order[key]} not found in ${process.env.THEME_BASE_PATH}sections/${name}.json`);
                }
            }
        }

        if (process.env.THEME_EDITOR_MODE) {
            groupContents = groupEditorMode(groupContents, name);
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
                ...data, ...this
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

        var data = { ...data, ...this };

        if (!options.hash.name) {
            return errorDisplay(`Widget name is required in section ${data.section_name}`);
        }

        if (!data.section.widgets || !data.section?.widgets?.hasOwnProperty(options.hash.name)) {
            return errorDisplay(`No widget named ${option.hash.name} in ${data.section_name}`);
        }

        var targetedWidget = data.section.widgets[options.hash.name];

        if (targetedWidget?.type) {
            switch (targetedWidget.type) {
                case "navigation":
                    targetedWidget.navigation = data.store.navigations[targetedWidget.handle];
                    break;

                default:
                    break;
            }
        }

        var variable = 'widget';
        if (options.hash.as !== undefined) {
            variable = options.hash.as;
        }

        var result = options.fn({
            [variable]: targetedWidget,
            ...data
        });

        if (process.env.THEME_EDITOR_MODE) {
            var widget = Handlebars.compile(widgetEditorMode(result, options.hash.name, targetedWidget));
            result = widget(data);
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
            return errorDisplay(`Invalid list value ${collection} on includes.`);
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
            return errorDisplay(`Invalid array or list value ${collection} on iterate.`);
        }

        let ItemsList = collection;

        if (collection.data !== undefined) {
            ItemsList = collection.data;
        }

        const limit = typeof options?.hash?.limit !== 'undefined' ? options.hash.limit : collection.length;
        const variable = options?.hash?.as || 'current';

        let result = '';

        // Iterate over the collection
        Object.keys(ItemsList).forEach((key, i) => {
            if (i >= limit) return;

            const item = ItemsList[key];
            if (typeof item === 'object') {
                item['index'] = i;
            }

            result += options.fn({
                ...this,
                [variable]: item,
                index: i,
            });
        });

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

        var result = `<a href="${pagination.page > 1 ? `?page=${(pagination.page - 1)}` : '#'}">${options.hash.previous}</a>`;
        var limit = options.hash.limit || 5;
        var index = 0;

        var buttons = '';

        if (pagination.page >= limit && pagination.pages > limit) {
            buttons += options.hash.collapse ? options.hash.collapse : `<span class="pagination-collapse">...</span>`;
        }

        while (index < limit) {
            
            let = page = (1 + index);
            if (pagination.page >= limit) {
                page = ((pagination.page - limit + 1) + index);
            }

            buttons += options.fn({ ...data, ...this, page, index: (index + 1), limit });
            
            if(pagination.pages == page) break;
            
            index++;
        }

        if (pagination.pages > page) {
            buttons += options.hash.collapse ? options.hash.collapse : `<span class="pagination-collapse">...</span>`;
        }

        result += buttons;
        result += `<a href="${pagination.page == pagination.pages ? '#' : `?page=${(pagination.page + 1)}`}">${options.hash.next}</a>`
        return result;
    });

    /**
     * To get an item in an array list using the index of the item
     * 
     * @params `list` <array>
     * @package `index` <integer>
     */
    Handlebars.registerHelper('item', function (list, index) {
        if (!Array.isArray(list)) {
            return errorDisplay(`Invalid array or list value ${list} on item.`);
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

        return options.fn({ ...data, ...this, item: search });
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
                form = `<form form-id="product_review_form" action="/review/add" method="POST" ${props}> 
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

            case "login":
                form = `<form form-id="login_account_form" action="/account/login" method="POST" ${props}>`;
                break;

            case "register":
                form = `<form form-id="register_account_form" action="/account/register" method="POST" ${props}>`;
                break;

            case "forgot-password":
                form = `<form form-id="forgot_password_form" action="/account/forgot-password" method="POST" ${props}>`;
                break;

            case "reset-password":
                form = `<form form-id="reset_password_form" action="/account/reset-password/${data.params.id}/${data.params.token}" method="POST" ${props}>`;
                break;

            case "add-address":
                form = `<form form-id="customer_address_add_form" action="/customer/address/add" method="POST" ${props}>`;
                break;

            case "update-address":
                form = `<form form-id="customer_address_update_form" action="/customer/address/${options.hash.address.id}" method="POST" ${props}>`;
                break;

            case "delete-address":
                form = `<form form-id="customer_address_delete_form" action="/customer/address/${options.hash.address.id}/delete" method="POST" ${props}>`;
                break;

            case "update-order":
                form = `<form form-id="customer_order_update_form" action="/customer/order/${options.hash.order.order_no}" method="POST" ${props}>`;
                break;

            default:
                break;
        }

        return `${form}${options.fn({ ...data, ...this })}</form>`;
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

    Handlebars.registerHelper('lowercase', function (text) {
        return text.toLowerCase();
    });

    Handlebars.registerHelper('uppercase', function (text) {
        return text.toUpperCase();
    });
}

