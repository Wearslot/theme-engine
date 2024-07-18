exports.errorPageBuild = process.env.NODE_ENV === 'development'
    ?
    `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Template Error</title>
    </head>

    <body>
        <div>
            <p>{{error}}</p>
        </div>
        <div>
            <p>{{stack}}</p>
        </div>
    </body>

    </html>`
    :

    `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Server Error</title>
        <style>
            @import url(https://fonts.googleapis.com/css?family=Roboto:400,100,300,500,700);

            body {
                background: #eeeef4;
                color: #000000;
                font-family: Roboto;
                width: 100%;
                overflow-x: hidden;
            }

            h1 {
                font-weight: 100;
                font-size: 27pt;
                color: #8a50fc;
                font-weight: 500;
            }

            p {
                font-weight: 400;
                font-size: 15px;
            }

            .warning-content {
                position: absolute;
                top: 25%;
                width: 100%;
                height: 300px;
                text-align: center;
                margin: 0;
            }
        </style>
    </head>

    <body>
        <div class="warning-content">
            <h1>Internal Server Error</h1>
            <svg width="126px" height="126px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg"
                transform="rotate(0)">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC"
                    stroke-width="0.096"></g>
                <g id="SVGRepo_iconCarrier">
                    <path
                        d="M2.20164 18.4695L10.1643 4.00506C10.9021 2.66498 13.0979 2.66498 13.8357 4.00506L21.7984 18.4695C22.4443 19.6428 21.4598 21 19.9627 21H4.0373C2.54022 21 1.55571 19.6428 2.20164 18.4695Z"
                        stroke="#8a50fc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M12 9V13" stroke="#8a50fc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    </path>
                    <path d="M12 17.0195V17" stroke="#8a50fc" stroke-width="1" stroke-linecap="round"
                        stroke-linejoin="round"></path>
                </g>
            </svg>
            <p>
                Please forgive the inconvenience. <br />
                We are currently trying to fix the problem.
            </p>
            <p>
                We'll be back up soon!
            </p>
        </div>
    </body>
    </html>`;