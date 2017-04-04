const http = require( 'http' );
const fs = require( 'fs' );
const path = require( 'path' );
const url = require( 'url' );

const PUBLIC_DIR = path.resolve( __dirname, 'public' );
const IMAGES_DIR = path.resolve( PUBLIC_DIR, 'images' );

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer( ( req, res ) => {
    // parse URL
    const parsedUrl = url.parse( req.url );

    // extract URL path
    let pathname = path.join( PUBLIC_DIR, parsedUrl.pathname );

    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const ext = path.parse( pathname ).ext || '.html';

    // maps file extention to MIME typere
    const map = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    };

    fs.exists( pathname, function ( exist ) {
        if ( !exist ) {
            // if the file is not found, return 404
            res.statusCode = 404;
            res.end( `File ${pathname} not found!` );
            return;
        }

        // if is a directory search for index file matching the extention
        if ( fs.statSync( pathname ).isDirectory() ) {
            pathname += 'index' + ext;
        }

        // read file from file system
        fs.readFile( pathname, function ( err, data ) {
            if ( err ) {
                res.statusCode = 500;
                res.end( `Error getting the file: ${err}.` );
            } else {
                // if the file is found, set Content-type and send data
                res.setHeader( 'Content-type', map[ext] || 'text/plain' );
                res.end( parseFile( pathname, data ) );
            }
        } );
    } );
} );

server.listen( port, hostname, () => {
    console.log( `Server running at http://${hostname}:${port}/` );
} );

function parseFile( file, data ) {
    if ( /index.html$/i.test( file ) ) {
        data = data
            .toString( 'UTF-8' )
            .replace( /IMAGES_TO_LOAD = \[];/, `IMAGES_TO_LOAD = [${getImages().map( file => `'${file}'` ).join( ',' )}];` );
    }

    return data;
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
