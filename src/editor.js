exports.editorMode = (pageContent) => {
    return `
        <style type="text/css">
            .taojaa-editor-wrapper, 
            .taojaa-group-wrapper {
                position:relative;
                overflow: visible;
                display: block;
            }

            .taojaa-editor-label {
                position:absolute;
                top: 0;
                left:0;
                display:none;
                font-size: 10px;
                font-weight: bold;
                color: #fff;
                background-color: #695eef;
                border-radius: 0 0 3px 0;
                padding: 0px 5px;
                cursor: pointer;
                z-index: 1000;
            }

            .taojaa-editor-wrapper:hover {
                border: 2px dashed #695eef;
            }
            
            .taojaa-editor-wrapper.no-inspector:hover {
                border: none !important;
            }

            .taojaa-editor-wrapper:hover > .taojaa-editor-label {
                display:block;
            }

            .taojaa-editor-wrapper.no-inspector:hover > .taojaa-editor-label {
                display:none !important;
            }
        </style>
        ${pageContent}
        <script type="text/javascript">
            function bindClickerEvents() {
                document.querySelectorAll('a, form').forEach((e) => { 
                    var attr = e.getAttribute('href') ? 'href' : 'action';
                    var surfix = window.location.href.split('?');

                    if(!e.hasAttribute(attr)) return;

                    let url;
                    let value = e.getAttribute(attr);
                    
                    if(e.getAttribute(attr).indexOf('?') > -1) {
                        url = e.getAttribute(attr) + '&' + surfix[1]
                    } else {
                        url = e.getAttribute(attr) + '?' + surfix[1]
                    }

                    if((value.indexOf('key=') > -1 && value.indexOf('theme_id=') > -1 && value.indexOf('editor_mode=') > -1) || (value.indexOf('theme_id=') > -1 && value.indexOf('editor_mode=') > -1)) return;

                    if(attr === 'href') {
                        e.addEventListener('click', (a) => {
                            a.preventDefault();
                            a.stopPropagation();
                            window.location.assign(url);
                            window.parent.postMessage({
                                action: "page_changed",
                                path: e.getAttribute('href')
                            }, "${process.env.TAOJAA_EDITOR_URL}");
                        })
                    } else {
                        e.setAttribute(attr, url);
                    }
                });
        
                document.querySelectorAll('.taojaa-editor-label,.taojaa-editor-wrapper').forEach(el => {
                    el.addEventListener('click', (t) => {
                        t.stopPropagation();
                        var message = {
                            action: "selected",
                            type: t.target.getAttribute('data-mode') || t.target.getAttribute('data-type'),
                            name: t.target.getAttribute('data-name')
                        }
                        window.parent.postMessage(message, "${process.env.TAOJAA_EDITOR_URL}");
                    })
                });
            }

            window.onload = () => bindClickerEvents();
        </script>
        <script type="text/javascript">
            window.addEventListener("message", (e) => {
                const data = e.data;
                if (data.action === 'taojaa:section:select') {
                    document.querySelector('[data-name="' + data.target + '"]').scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "center"
                    });
                }

                else if (data.action === 'taojaa:section:update') {
                    document.querySelector('[data-type="section"][data-name="' + data.target + '"]').outerHTML = data.content;
                    bindClickerEvents();
                }

                else if (data.action === 'taojaa:group:update') {
                    document.querySelector('[data-type="group"][data-name="' + data.target + '"]').outerHTML = data.content;
                    bindClickerEvents();
                }

                else if (data.action === 'taojaa:template:update') {
                    if(data.partial) {
                        document.querySelector('[data-type="template"]').outerHTML = data.content;
                        bindClickerEvents();
                    } else {
                        document.open();
                        document.write(data.content);
                        document.close();
                    }
                } 

                else {
                    const event = new Event(data.action, { bubbles: true });
                    document.dispatchEvent(event);
                }
            });


            document.addEventListener('taojaa:section:disable-inspector', () => {
                document.querySelectorAll('.taojaa-editor-wrapper').forEach((e) => {
                    e.classList.add('no-inspector')
                });
            });

            document.addEventListener('taojaa:section:enable-inspector', () => {
                document.querySelectorAll('.taojaa-editor-wrapper').forEach((e) => {
                    e.classList.remove('no-inspector')
                });
            });
        </script>
    `;
}

exports.previewMode = (pageContent) => {
    return `
        ${pageContent}
        <script type="text/javascript">
            function bindClickerEvents() {
                document.querySelectorAll('a, form').forEach((e) => { 
                    var attr = e.getAttribute('href') ? 'href' : 'action';
                    var surfix = window.location.href.split('?');

                    let url;
                    let value = e.getAttribute(attr);

                    if(!e.hasAttribute(attr)) return;

                    if(e.getAttribute(attr).indexOf('?') > -1) {
                        url = e.getAttribute(attr) + '&' + surfix[1]
                    } else {
                        url = e.getAttribute(attr) + '?' + surfix[1]
                    }

                    if((value.indexOf('key=') > -1 && value.indexOf('theme_id=') > -1) || (value.indexOf('theme_id=') > -1)) return;

                    if(attr === 'href') {
                        e.addEventListener('click', (a) => {
                            a.preventDefault();
                            window.location.assign(url);
                        })
                    } else {
                        e.setAttribute(attr, url);
                    }
                });
            }
            bindClickerEvents();
        </script>
    `;
}

exports.templateMode = (pageContent) => {
    return `
        <section data-type="template">
            ${pageContent}
        </section>
    `;
}

exports.groupEditorMode = (content, group) => {
    return `
        <section class="taojaa-group-wrapper" data-type="group" data-name="${group}">
            <section class="taojaa-editor-inner-content">${content}</section>
        </section>
    `;
}

exports.sectionEditorMode = (content) => {
    return `
        <section class="taojaa-editor-wrapper" data-type="section" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}" settings="{{json section}}">
            <span class="taojaa-editor-label" data-mode="section" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}">{{clean section_name}}</span>
            <section class="taojaa-editor-inner-content">${content}</section>
        </section>
    `;
}

exports.widgetEditorMode = (content, name, widget) => {
    return `
        <section class="taojaa-editor-wrapper" data-type="widget" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}--${name}" settings="${JSON.stringify(widget)}">
            <span class="taojaa-editor-label" data-mode="widget" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}--${name}">{{clean '${name}'}}</span>
            <section class="taojaa-editor-inner-content">${content}</section>
        </section>
    `;
}