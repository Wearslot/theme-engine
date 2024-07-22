exports.editorMode = (pageContent) => {
    return `
        <section data-type="template">
        <style type="text/css">
            .taojaa-editor-wrapper {
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
        <script type="text/javascript">
            window.onload = () => {
                document.querySelectorAll('a,button').forEach((e) => e.addEventListener('click', (a) => a.preventDefault()))
                document.querySelectorAll('form').forEach((e) => e.addEventListener('submit', (a) => a.preventDefault()))
                document.querySelectorAll('input, select, textarea').forEach((e) => e.setAttribute('disabled', true))
            }
        </script>
        ${pageContent}
        <script type="text/javascript">
            document.querySelectorAll('.taojaa-editor-label,.taojaa-editor-wrapper').forEach(el => {
                el.addEventListener('click', (t) => {
                    var message = {
                        action: "selected",
                        type: t.target.getAttribute('data-type'),
                        name: t.target.getAttribute('data-name')
                    }
                    window.parent.postMessage(message, "${process.env.EDITOR_URL}");
                })
            });
        </script>
        </section>
    `;
}

exports.sectionEditorMode = (content) => {
    return `
        <section class="taojaa-editor-wrapper" data-type="section" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}" settings="{{json section}}">
            <span class="taojaa-editor-label" data-type="section" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}">{{clean section_name}}</span>
            <section class="taojaa-editor-inner-content">${content}</section>
        </section>
    `;
}

exports.widgetEditorMode = (content, name, widget) => {
    return `
        <section class="taojaa-editor-wrapper" data-type="widget" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}--${name}" settings="${JSON.stringify(widget)}">
            <span class="taojaa-editor-label" data-type="widget" data-name="{{#if group_name}}{{group_name}}--{{/if}}{{section_name}}--${name}">{{clean '${name}'}}</span>
            <section class="taojaa-editor-inner-content">${content}</section>
        </section>
    `;
}