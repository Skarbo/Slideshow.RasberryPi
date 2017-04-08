const http = require( 'http' );
const fs = require( 'fs' );
const path = require( 'path' );
const url = require( 'url' );
const express = require( 'express' );

const PUBLIC_DIR = path.resolve( __dirname, 'public' );
const IMAGES_DIR = path.resolve( __dirname, 'images' );

const port = 3000;

const app = express();

app.get( '/', ( req, res ) => {
    res.send( parseFile( fs.readFileSync( path.resolve( PUBLIC_DIR, 'index.html' ) ) ) );
} );

app.use( '/images', express.static( IMAGES_DIR ) );

app.listen( port, () => {
    console.log( `App listening on port ${port}` );
} );

function parseFile( data ) {
    return data.toString().replace( /IMAGES_TO_LOAD = \[];/, `IMAGES_TO_LOAD = [${getImages().map( file => `'${file}'` ).join( ',' )}];` );
}

/**
 * @return {Array<String>}
 */
function getImages() {
    return fs
        .readdirSync( IMAGES_DIR, {encoding: 'UTF-8'} )
        .filter( file => /(jpeg|jpg|png|gif)$/i.test( file ) )
        .map( file => `images/${file}` );
}

console.log( getImages() );
