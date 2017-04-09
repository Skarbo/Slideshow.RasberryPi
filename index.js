const http = require( 'http' );
const fs = require( 'fs' );
const path = require( 'path' );
const url = require( 'url' );
const express = require( 'express' );
const usb = require( 'usb' );
const ini = require( 'ini' );
const extend = require( 'extend' );

const PUBLIC_DIR = path.resolve( __dirname, 'public' );
const IMAGES_DIR_DEFAULT = path.resolve( __dirname, 'images' );
const CONFIG_FILE = path.resolve( __dirname, 'config.json' );
const SETTINGS_FILE_NAME = 'SETTINGS.txt';
let CONFIG = getConfig();

const port = 3000;
const app = express();
let server;
let lastRestart;
let imagesFolder;

/**
 * @return {Array<String>}
 */
function getImages() {
    console.log( 'getImages', imagesFolder );
    try {
        return fs
            .readdirSync( imagesFolder, {encoding: 'UTF-8'} )
            .filter( file => /(jpeg|jpg|png|gif)$/i.test( file ) )
            .map( file => `images/${file}` );
    }
    catch ( e ) {
        console.log( 'getImages', 'Could not get images', imagesFolder );
        return [];
    }
}

function findSlideshowFolder() {
    return new Promise( ( fulfill ) => {
        const folders = fs.readdirSync( path.resolve( CONFIG['volumesDir'] ), {encoding: 'UTF-8'} );
        console.log( 'findSlideshowFolder', folders );
        for ( let i = 0; i < folders.length; i++ ) {
            try {
                fs.statSync( path.resolve( CONFIG['volumesDir'], folders[i], CONFIG['imagesDirName'] ) );
                imagesFolder = path.resolve( CONFIG['volumesDir'], folders[i], CONFIG['imagesDirName'] );
                return fulfill();
            }
            catch ( e ) {
                // ignore
            }
        }

        console.log( 'findSlideshowFolder', 'Could not find slideshow folder, using default' );
        imagesFolder = IMAGES_DIR_DEFAULT;
        fulfill( IMAGES_DIR_DEFAULT );
    } );
}

function doStartApp() {
    CONFIG = getConfig();

    console.log( 'doStartApp', 'Start app' );
    findSlideshowFolder()
        .then( () => startServer() )
        .then( () => {
            console.log( 'doStartApp', 'App started' );
            lastRestart = Date.now();
        } )
        .catch( err => console.error( 'doStartApp', err ) );
}

function startServer() {
    return new Promise( ( fulfill ) => {
        if ( server ) {
            console.log( 'startServer', 'Stopping server' );
            server.close();
        }

        console.log( 'startServer', imagesFolder );

        const parseIndexFile = () => {
            const file = fs.readFileSync( path.resolve( PUBLIC_DIR, 'index.html' ) );
            return file.toString()
                .replace( /IMAGES_TO_LOAD = \[];/, `IMAGES_TO_LOAD = ${JSON.stringify( getImages() )};` )
                .replace( /SLIDESHOW_INTERVAL = .*?;/, `SLIDESHOW_INTERVAL = ${CONFIG['slideshowInterval']};` );
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

        server = app.listen( port, () => {
            console.log( 'startServer', 'Server started', port );
            fulfill();
        } );
    } );
}

function getConfig() {
    let settings = {};

    try {
        settings = ini.decode( fs.readFileSync( path.resolve( imagesFolder, SETTINGS_FILE_NAME ), {encoding: 'UTF-8'} ) )
    }
    catch ( e ) {
        // ignore
    }

    try {
        return extend( JSON.parse( fs.readFileSync( CONFIG_FILE, {encoding: 'UTF-8'} ) ) || {}, settings );
    }
    catch ( e ) {
        return settings;
    }
}

usb.on( 'attach', device => {
    console.log( 'USB device attached, waiting 10 sec to restart app', device );

    setTimeout( doStartApp, 10000 );
} );

usb.on( 'detach', device => {
    console.log( 'USB device detached', device );
} );

doStartApp();