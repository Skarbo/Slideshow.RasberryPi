// PACKAGES

const http = require( 'http' );
const fs = require( 'fs' );
const path = require( 'path' );
const url = require( 'url' );
const express = require( 'express' );
const usb = require( 'usb' );
const ini = require( 'ini' );
const extend = require( 'extend' );

// CONSTANTS

const TAG = '[App~%s] ';
const PUBLIC_DIR = path.resolve( __dirname, 'public' );
const IMAGES_DIR_DEFAULT = path.resolve( __dirname, 'images' );
const SETTINGS_FILE_NAME = 'SETTINGS.txt';
const START_APP_DELAY = 10000;

// VARIABLES

const app = express();
let config = require( path.resolve( __dirname, 'config.json' ) );
let server;
let lastRestart;
let imagesFolder;

// FUNCTIONS

/**
 * @return {Array<String>}
 */
function getImages() {
    try {
        return fs
            .readdirSync( imagesFolder, {encoding: 'UTF-8'} )
            .filter( file => /(jpeg|jpg|png|gif)$/i.test( file ) )
            .map( file => `images/${file}` );
    }
    catch ( e ) {
        console.log( TAG, 'getImages', 'Could not get images', imagesFolder );
        return [];
    }
}

/**
 * Find slideshow folder
 * @returns {Promise}
 */
function findSlideshowFolder() {
    return new Promise( ( fulfill ) => {
        try {
            const folders = fs.readdirSync( path.resolve( config['volumesDir'] ), {encoding: 'UTF-8'} );
            console.log( TAG, 'findSlideshowFolder', folders );

            for ( let i = 0; i < folders.length; i++ ) {
                try {
                    fs.statSync( path.resolve( config['volumesDir'], folders[i], config['imagesDirName'] ) );
                    imagesFolder = path.resolve( config['volumesDir'], folders[i], config['imagesDirName'] );
                    return fulfill();
                }
                catch ( e ) {
                    // ignore
                }
            }
        }
        catch ( e ) {
            // ignore
        }

        console.log( TAG, 'findSlideshowFolder', 'Could not find slideshow folder, using default' );
        imagesFolder = IMAGES_DIR_DEFAULT;
        fulfill( IMAGES_DIR_DEFAULT );
    } );
}

/**
 * Start server
 * @returns {Promise}
 */
function startServer() {
    return new Promise( ( fulfill ) => {
        if ( server ) {
            console.log( TAG, 'startServer', 'Stopping server' );
            server.close();
        }

        console.log( TAG, 'startServer', imagesFolder );

        const parseIndexFile = () => {
            const file = fs.readFileSync( path.resolve( PUBLIC_DIR, 'index.html' ) );
            return file.toString()
                .replace( /IMAGES_TO_LOAD = \[];/, `IMAGES_TO_LOAD = ${JSON.stringify( getImages() )};` )
                .replace( /SLIDESHOW_INTERVAL = .*?;/, `SLIDESHOW_INTERVAL = ${config['slideshowInterval']};` )
                .replace( /(\d+)ms/g, `${config['slideshowTransition']}ms` );
        };

        app.get( '/', ( req, res ) => {
            res.send( parseIndexFile() );
        } );

        app.get( '/api/status', ( req, res ) => {
            res.send( {
                lastRestart
            } );
        } );

        app.use( '/images', express.static( imagesFolder ) );

        server = app.listen( config['serverPort'], () => {
            console.log( TAG, 'startServer', 'Server started', config['serverPort'] );
            fulfill();
        } );
    } );
}

/**
 * Update config with settings ini file in images folder, if one exists
 */
function updateConfig() {
    let settings = {};

    try {
        settings = ini.decode( fs.readFileSync( path.resolve( imagesFolder, SETTINGS_FILE_NAME ), {encoding: 'UTF-8'} ) ) || {};
    }
    catch ( e ) {
        // ignore
    }

    config = extend( config, settings );
    console.log( TAG, 'updateConfig', config );
    return true;
}

/**
 * Start app
 */
function doStartApp() {
    console.log( TAG, 'doStartApp', `Start app (in ${START_APP_DELAY} ms)` );

    setTimeout( () => {
        findSlideshowFolder()
            .then( updateConfig )
            .then( () => startServer() )
            .then( () => {
                console.log( TAG, 'doStartApp', 'App started' );
                lastRestart = Date.now();
            } )
            .catch( err => console.error( 'doStartApp', err, err.stack ) );
    }, START_APP_DELAY );
}

// INIT

// usb attached
usb.on( 'attach', device => {
    console.log( TAG, 'attach', device );

    doStartApp();
} );

// usb detached
usb.on( 'detach', device => {
    console.log( TAG, 'detach', device );
} );

// START

doStartApp();