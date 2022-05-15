/*///////////////////////////////////////////////////////////////////////////////////////////////////
isaacCSPRNG 1.1 (+ 7 cyphers with symbol_by_symbol encrypt/decrypt and using the custom keys).
/////////////////////////////////////////////////////////////////////////////////////////////////////
https://github.com/macmcmeans/isaacCSPRNG/blob/master/isaacCSPRNG-1.1.js
/////////////////////////////////////////////////////////////////////////////////////////////////////
This is a derivative work copyright (c) 2018, William P. "Mac" McMeans, under BSD license.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of isaacCSPRNG nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
Original work copyright (c) 2012 Yves-Marie K. Rinquin, under MIT license.
https://github.com/rubycon/isaac.js
///////////////////////////////////////////////////////////////////////////////////////////////////*/
isaacCSPRNG = function( specifiedSeed ){
    return (function( userSeed ) {
        "use strict";

        /* private: internal states */
        var m = new Array( 256 )   // internal memory
            , acc = 0              // accumulator
            , brs = 0              // last result
            , cnt = 0              // counter
            , r = new Array( 256 ) // result array
            , gnt = 0              // generation counter
        ;

        var _version = '1.1';

        ////////////////////////////////////////////////////
        /* initial random seed */

        // seed( Math.random() * 0xffffffff ); // 4294967295

        var internalSeed
            , uinta = new Uint32Array( 2 )
            , defaultInternalSeed = new Array()
        ;
        window.crypto.getRandomValues( uinta );
        defaultInternalSeed = uinta[ 0 ] + uinta[ 1 ];

        internalSeed = userSeed || defaultInternalSeed;

        seed( internalSeed ); 
        ////////////////////////////////////////////////////



        /* private: 32-bit integer safe adder */
        function _add( x, y ) {
            var lsb = ( x & 0xffff ) + ( y & 0xffff )
                , msb = ( x >>>   16 ) + ( y >>>   16 ) + ( lsb >>> 16 )
            ;

            return ( msb << 16 ) | ( lsb & 0xffff );
        };



        /* private:  return data converted from hex string */
        function _hexDecode( data ){
            var j
                , hexes = data.match(/.{1,4}/g) || []
                , back = ""
            ;

            for( j = 0; j < hexes.length; j++ ) {
                back += String.fromCharCode( parseInt( hexes[ j ], 16 ) );
            }

            return back;
        };



        /* private: return data converted to hex string */
        function _hexEncode( data ){
            var hex
                , i
            ;

            var result = "";
            for( i = 0; i < data.length; i++ ) {
                hex = data.charCodeAt( i ).toString( 16 );
                result += ( "000" + hex ).slice( -4 );
            }

            return result;
        };



        /* private: return the CSPRNG _internals in an object (for get/set) */
        function _internals() {
            return {
                  a : acc
                , b : brs
                , c : cnt
                , m : m
                , r : r
                , g : gnt
            };
        };



        /* private: check if number is integer */
        function _isInteger( n ) { 
            return parseInt( n ) === n; 
        };



        /* private: convert string to integer array */
        /* js string (ucs-2/utf16) to a 32-bit integer (utf-8 chars, little-endian) array */
        function _toIntArray( string ) {
            var w1
                , w2
                , u
                , r4 = []
                , r = []
                , i = 0
                , s = string + '\0\0\0' // pad string to avoid discarding last chars
                , l = s.length - 1
            ;

            while( i < l ) {
                w1 = s.charCodeAt( i++   );
                w2 = s.charCodeAt( i + 1 );
            
                // 0x0000 - 0x007f code point: basic ascii
                if( w1 < 0x0080 ) {
                    r4.push( w1 );
            
                } else 

                // 0x0080 - 0x07ff code point
                if( w1 < 0x0800 ) {
                    r4.push( ( ( w1 >>>  6 ) & 0x1f ) | 0xc0 );
                    r4.push( ( ( w1 >>>  0 ) & 0x3f ) | 0x80 );
            
                } else

                // 0x0800 - 0xd7ff / 0xe000 - 0xffff code point
                if( ( w1 & 0xf800 ) != 0xd800 ) {
                    r4.push( ( ( w1 >>> 12 ) & 0x0f ) | 0xe0 );
                    r4.push( ( ( w1 >>>  6 ) & 0x3f ) | 0x80 );
                    r4.push( ( ( w1 >>>  0 ) & 0x3f ) | 0x80 );
                
                } else 

                // 0xd800 - 0xdfff surrogate / 0x10ffff - 0x10000 code point
                if( ( ( w1 & 0xfc00 ) == 0xd800 ) && ( ( w2 & 0xfc00 ) == 0xdc00 ) ) {
                    u = ( ( w2 & 0x3f ) | ( ( w1 & 0x3f ) << 10 ) ) + 0x10000;
                    r4.push( ( ( u >>> 18 ) & 0x07 ) | 0xf0 );
                    r4.push( ( ( u >>> 12 ) & 0x3f ) | 0x80 );
                    r4.push( ( ( u >>>  6 ) & 0x3f ) | 0x80 );
                    r4.push( ( ( u >>>  0 ) & 0x3f ) | 0x80 );
                    i++;
                
                } else {
                    // invalid char
                }

                /* _add integer (four utf-8 value) to array */
                if( r4.length > 3 ) {
                    
                    // little endian
                    r.push( 
                        ( r4.shift() <<  0 ) | ( r4.shift() <<  8 ) | ( r4.shift() << 16 ) | ( r4.shift() << 24 )
                    );
                }
            }

            return r;
        };



        /* private: return a Vernam (XOR) transform of msg */
        function _vernam( msg ) {
            var out = "";

            for( var i = 0; i < msg.length; i++)  {
                var ra = range( 33, 126 );
                out += String.fromCharCode( ra ^ msg.charCodeAt( i ) );
            }

            return out;
        };



        /* public: return an array of amount elements consisting of unsigned random integers in the range [0, 255] */
        function bytes( amount ) {
            var out = new Array( amount );
            
            for( var i = 0; i < amount; i++ ) {
                out[ i ] = range( 255 );
            }

            return out;
        };



        /* public: return a string of length (safe) characters consisting of random 7-bit ASCII graphemes */
        function chars( length ) {
            //var str = " ~`'\"_-+={}[]<>/\\,.:;?|!@#$%^&*()0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            var str = " ~`_-+={}[]<>/,.:;?|!@#$%^&*()0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
                , out = ''
            ;

            for( var i = 0; i < length; i++ ) {
                out += str[ range( 0, str.length - 1 ) ];
            }
            
            return out;
        };



        /* public: return vernam transform on ciphertext string data/hex string data */
        function decipher( key, msg, flag ) {
            seed( key );

            if( Number( flag ) === 1 ) {
                return _vernam( _hexDecode( msg ) );
            
            } else {
                return _vernam( msg );
            }
        };



        /* public: return a 53-bit fraction in the range [0, 1] */
        function double() { 
            return random() + ( random() * 0x200000 | 0 ) * 1.1102230246251565e-16; // 2^-53  
        };



        /* public: return vernam transform on plaintext string data/hex string data */
        function encipher( key, msg, flag ) {
            seed( key );

            if( Number( flag ) === 1 ) {
                return _hexEncode( _vernam( msg ) );
            
            } else {
                return _vernam( msg );
            }
        };



        /* public: export object describing CSPRNG internal state */
        function get() {
            return JSON.stringify( _internals() );
        };



        /* public: return an unsigned random integer in the range [0, 2^32] */
        function int32() { 
            var _r = rand();
            return _r < 0 ? -_r : _r;
        };



        /* public: expose internals */
        function internals() { 
            return {
                  a: acc
                , b: brs
                , c: cnt
                , m: m
                , r: r
            };
        };



        /* public: isaac generator, n = number of runs */
        function prng( n ){	//each run rotate PRNG by 256 bytes.
            var i
                , x
                , y
            ;

            n = ( n && typeof n === 'number' ? Math.abs( Math.floor( n ) ) : 1 );

            while( n-- ) {
                cnt = _add( cnt,   1 );
                brs = _add( brs, cnt );

                for( i = 0; i < 256; i++ ) {
                    switch( i & 3 ) {
                        case 0: acc ^= acc <<  13; break;
                        case 1: acc ^= acc >>>  6; break;
                        case 2: acc ^= acc <<   2; break;
                        case 3: acc ^= acc >>> 16; break;
                    }

                    acc        = _add( m[ ( i +  128 ) & 0xff ], acc ); x = m[ i ];
                    m[i] =   y = _add( m[ ( x >>>  2 ) & 0xff ], _add( acc, brs ) );
                    r[i] = brs = _add( m[ ( y >>> 10 ) & 0xff ], x );
                }
            }
        };



		//skip k bytes.
		function skip_bytes(k){
			var rounds = 0;
			if(k>256){
				rounds = Math.floor(k/256);
				k = k % 256;
			}
			if(rounds!==0){
				prng.bytes(rounds);
			}
			bytes(k);
		}



        /* public: return a signed random integer in the range [-2^31, 2^31] */
        function rand() {
            if( !gnt-- ) { 
                prng(); 
                gnt = 255; 
            }

            return r[ gnt ];
        };



        /* public: return a 32-bit fraction in the range [0, 1] */
        function random() {
            return 0.5 + rand() * 2.3283064365386963e-10; // 2^-32
        };



        /* public: return inclusive range */
        function range() { 
            var loBound
                , hiBound
            ;
            
            if( arguments.length === 1 ) {
                loBound = 0;
                hiBound = arguments[ 0 ];

            } else {
                loBound = arguments[ 0 ];
                hiBound = arguments[ 1 ];
            }

            if( arguments[ 0 ] > arguments[ 1 ] ) { 
                loBound = arguments[ 1 ];
                hiBound = arguments[ 0 ];
            }

            // return integer
            if( _isInteger( loBound ) && _isInteger( hiBound ) ) { 
                return Math.floor( random() * ( hiBound - loBound + 1 ) ) + loBound; 

            // return float
            } else {
                return random() * ( hiBound - loBound ) + loBound; 
            }
        };



        /* public: zeroize the CSPRNG */
        function reset() {
            acc = brs = cnt = 0;
           
            for( var i = 0; i < 256; ++i ) { 
                m[ i ] = r[ i ] = 0; 
            }

            gnt = 0;
        };



        /* public: seeding function */
        function seed( seed ) {
            var a
                , b
                , c
                , d
                , e
                , f
                , g
                , h
                , i
            ;

            /* seeding the seeds of love */
            a = b = c = d = e = f = g = h = 

                /* the golden ratio ( 2654435769 ), 
                see https://stackoverflow.com/questions/4948780/magic-number-in-boosthash-combine 
                */
                0x9e3779b9
            ;     

            if( seed && typeof seed === 'string' ) { seed = _toIntArray( seed ); }

            if( seed && typeof seed === 'number' ) { seed = [ seed ]; }

            if( seed instanceof Array ) {
                reset();
                
                for( i = 0; i < seed.length; i++ ) {
                    r[ i & 0xff ] += ( typeof seed[ i ] === 'number' ? seed[ i ] : 0 );
                }
            }

            /* private: seed mixer */
            function _seed_mix() {
                a ^= b <<  11; d = _add( d, a ); b = _add( b, c );
                b ^= c >>>  2; e = _add( e, b ); c = _add( c, d );
                c ^= d <<   8; f = _add( f, c ); d = _add( d, e );
                d ^= e >>> 16; g = _add( g, d ); e = _add( e, f );
                e ^= f <<  10; h = _add( h, e ); f = _add( f, g );
                f ^= g >>>  4; a = _add( a, f ); g = _add( g, h );
                g ^= h <<   8; b = _add( b, g ); h = _add( h, a );
                h ^= a >>>  9; c = _add( c, h ); a = _add( a, b );
            }

            /* scramble it */
            for( i = 0; i < 4; i++ ) { _seed_mix(); }

            for( i = 0; i < 256; i += 8 ) {
                
                /* use all the information in the seed */
                if( seed ) {
                    a = _add( a, r[ i + 0 ] ); b = _add( b, r[ i + 1 ] );
                    c = _add( c, r[ i + 2 ] ); d = _add( d, r[ i + 3 ] );
                    e = _add( e, r[ i + 4 ] ); f = _add( f, r[ i + 5 ] );
                    g = _add( g, r[ i + 6 ] ); h = _add( h, r[ i + 7 ] );
                }

                _seed_mix();

                /* fill in m[] with messy stuff */
                m[ i + 0 ] = a; m[ i + 1 ] = b; m[ i + 2 ] = c; m[ i + 3 ] = d;
                m[ i + 4 ] = e; m[ i + 5 ] = f; m[ i + 6 ] = g; m[ i + 7 ] = h;
            }
        
            /* do a second pass to make all of the seed affect all of m[] */
            if( seed ) {
                for( i = 0; i < 256; i += 8 ) {
                    a = _add( a, m[ i + 0 ] ); b = _add( b, m[ i + 1 ] );
                    c = _add( c, m[ i + 2 ] ); d = _add( d, m[ i + 3 ] );
                    e = _add( e, m[ i + 4 ] ); f = _add( f, m[ i + 5 ] );
                    g = _add( g, m[ i + 6 ] ); h = _add( h, m[ i + 7 ] );
                    
                    _seed_mix();
                    
                    /* fill in m[] with messy stuff (again) */
                    m[ i + 0 ] = a; m[ i + 1 ] = b; m[ i + 2 ] = c; m[ i + 3 ] = d;
                    m[ i + 4 ] = e; m[ i + 5 ] = f; m[ i + 6 ] = g; m[ i + 7 ] = h;
                }
            }

            /* fill in the first set of results */
            prng(); 

            /* prepare to use the first set of results */;
            gnt = 256;
        };



        /* public: import object and use it to set CSPRNG internal state */
        function set( incoming ) {
            var imported = JSON.parse( incoming );
            acc = imported.a;
            brs = imported.b;
            cnt = imported.c;
            m   = imported.m;
            r   = imported.r;
            gnt = imported.g;
        };



        /* public: show version */
        function version() {
            return _version;
        };




		
		
		
		
		
		




//Begin source code for 7 cyphers:
	
	//BEGIN CIPHERS BLOCK

	//all modes
	var modes = [
		//Reversive
			'vernam',
			'shifted_atbash',
			'beaufort',
			'atbash',
		//Not reversive
			'tritemius',
			'gronsfeld',
			'vizhener'
	];

	var algo = 'vernam';							//define current mode
	
/*
//This 7 cyphers working with castom keys and can be used without isaacCSPRNG.
//isaacCSPRNG key = seed + message.length
//________________________________________________________________________________________________________________________________________
//USAGE:

	var prng = isaacCSPRNG();			//Define generator object with isaacCSPRNG


//1. 	Update alphabet to custom alphabet.

//	directly:
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );

//	or on try to encrypt-decrypt strings with new alphabet:
		console.log( prng.progress_string('', '', '', '', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '') );

//	or on try to encrypt-decrypt symbol with new alphabet:
		console.log( prng.symbol('', '', '', '', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '') );

		

//2.	Get current alphabet:
		console.log( prng.param_get('alphabet') );

//3.	Show all cipher algorithms:
		console.log(prng.param_get('algos')); //["vernam", "shifted_atbash", "beaufort", "atbash", "tritemius", "gronsfeld", "vizhener"]
		
//4.	Set and update curent cipher algorithm.

//	directly:
		//reversive
		console.log( prng.param_set('algo', 	'vernam') );
		console.log( prng.param_set('algo', 	'shifted_atbash') );
		console.log( prng.param_set('algo', 	'beaufort') );
		console.log( prng.param_set('algo', 	'atbash') );
		//not reversive
		console.log( prng.param_set('algo', 	'tritemius') );
		console.log( prng.param_set('algo', 	'gronsfeld') );
		console.log( prng.param_set('algo', 	'vizhener') );
		
//	or on try to encrypt-decrypt strings with new algo:
		//reversive
		console.log( prng.progress_string('', '', '', 'vernam') );
		console.log( prng.progress_string('', '', '', 'shifted_atbash') );
		console.log( prng.progress_string('', '', '', 'beaufort') );
		console.log( prng.progress_string('', '', '', 'atbash') );
		//not reversive
		console.log( prng.progress_string('', '', '', 'tritemius') );
		console.log( prng.progress_string('', '', '', 'gronsfeld') );
		console.log( prng.progress_string('', '', '', 'vizhener') );

//	or on try to encrypt-decrypt symbol with new algo:
		//reversive
		console.log( prng.symbol('', '', '', 'vernam') );
		console.log( prng.symbol('', '', '', 'shifted_atbash') );
		console.log( prng.symbol('', '', '', 'beaufort') );
		console.log( prng.symbol('', '', '', 'atbash') );
		//not reversive
		console.log( prng.symbol('', '', '', 'tritemius') );
		console.log( prng.symbol('', '', '', 'gronsfeld') );
		console.log( prng.symbol('', '', '', 'vizhener') );

		

//5.	Show current algo:
		console.log( prng.param_get('algo') );

		
//6.	Set XOR_char for vernam encrypt-decrypt:
		console.log( prng.param_set('XOR_char', 	'+') );						//directly
		console.log( prng.progress_string(undefined, '', undefined, '', undefined, '♥') );	//	or on try to encrypt-decrypt strings with new algo
		console.log( prng.symbol('', undefined, '', undefined, '', '▲') );					//	or on try to encrypt-decrypt symbol with new algo

//7.	Get current XOR_char:
		console.log( prng.param_get('XOR_char') );
		
		
		
//8.	Encrypt/decrypt symbol-by-symbol, with reversive and not reversive cipher algorithms, using CSPRNG or specified keys:
		console.log( prng.param_set('algo', 		'vernam') );
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );
		console.log( prng.param_set('XOR_char', 	'♥') ); 
		
		//Encrypt:
		console.log( prng.seed('My_super_secret_start_seed') );	// set start seed
		console.log( prng.symbol('B') );	// return array 		[cypher_symbol, key_symbol] //["T", "S"]	//CSPRNG values for this seed
		console.log( prng.symbol('B') );	// return new array 	[cypher_symbol, key_symbol] // ["N", "M"]	//CSPRNG values for this seed
		//Key is generated, using CSPRNG, according start seed.
		
		//Decrypt
			//set values
		console.log( prng.param_set('algo', 	'vernam') );
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );
		console.log( prng.param_set('XOR_char', 	'♥') ); 
			//decrypt with specified key
		console.log(prng.symbol('T', '', 'S'));			// ["B", "S"]	//text + specified key
		console.log(prng.symbol('N', undefined, 'M'));	// ["B", "M"]	//text + specified key
			//or decrypt, using CSPRNG
		console.log(prng.seed('My_super_secret_start_seed'));
		console.log(prng.symbol('T'));			// ["B", "S"]	//text + CSPRNG key
		console.log(prng.symbol('N'));			// ["B", "M"]	//text + CSPRNG key
		
		//Same for another reversive cipher algos...
		console.log( prng.param_set('algo', 	'vernam') );
		console.log( prng.param_set('algo', 	'shifted_atbash') );
		console.log( prng.param_set('algo', 	'beaufort') );
		console.log( prng.param_set('algo', 	'atbash') );
		// + previous code ...
		
		//For not reversive algorithms Need specify second parameter "[En]crypt", "[En]cipher" or "[De]crypt", "[De]cipher":
		//console.log( prng.symbol('', '', '', 'tritemius') );
		//console.log( prng.symbol('', '', '', 'gronsfeld') );
		//console.log( prng.symbol('', '', '', 'vizhener') );
		
		//Example not reversive - encrypt:
		console.log( prng.symbol('', '', '', 'vizhener') );
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );
		console.log(prng.seed('My_super_secret_start_seed'));

		console.log( prng.symbol('B', 'Encipher') );		//["C", "B"]	//cyphertext + CSPRNG key
		console.log( prng.symbol('B', 'Encrypt') );			//["S", "R"]	//cyphertext + CSPRNG key
		console.log( prng.symbol('B', 'Encalculate') );		//["Q", "P"]	//cyphertext + CSPRNG key
		
		//Example not reversive - decrypt with CSPRNG:
		console.log( prng.symbol('', '', '', 'vizhener') );
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );
		console.log(prng.seed('My_super_secret_start_seed'));

		console.log( prng.symbol('C', 'Decipher') );		//text + CSPRNG key
		console.log( prng.symbol('S', 'Decrypt') );			//text + CSPRNG key
		console.log( prng.symbol('Q', 'Decalculate') );		//text + CSPRNG key
		
		//Example not reversive - decrypt with specified key:
		console.log( prng.symbol('C', 'Decipher', 'B') );			//text + specified key
		console.log( prng.symbol('S', 'Decrypt', 'R') );			//text + specified key
		console.log( prng.symbol('Q', 'Decalculate', 'P') );		//text + specified key
		
		
		
//8.	Encrypt/decrypt strings, with reversive cipher algorithms, using CSPRNG or using specified keys:
		console.log( prng.param_set('algo', 		'vernam') );
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );
		console.log( prng.param_set('XOR_char', 	'▲') );
		
		//Encrypt:
		console.log( prng.seed('My_super_secret_start_seed') );	// set start seed
		console.log( prng.progress_string('Encrypt', 'THISISMYTEXT') );
		// return array			[cypher_string, key_string] 	//["BLRRNHUMVWEC", "SMZDFVYUGSTR"]		//CSPRNG values for this seed
		
		console.log( prng.progress_string('Encrypt', 'THISISMYTEXT') );
		// return new array 	[cypher_symbol, key_symbol]		//["▲KOJU▲OHHZ▲ODRQ", "JJBGWVLBNHGD"]	//CSPRNG values for this seed

		//Decrypt
			//set values
		console.log( prng.param_set('algo', 	'vernam') );
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );
		console.log( prng.param_set('XOR_char', 	'▲') ); 
			//decrypt with specified key
		console.log(prng.progress_string('Encrypt', "BLRRNHUMVWEC", "SMZDFVYUGSTR"));
		//["THISISMYTEXT", "SMZDFVYUGSTR"]		//text + specified key
	
		console.log(prng.progress_string('Encrypt', "▲KOJU▲OHHZ▲ODRQ", "JJBGWVLBNHGD"));
		//["THISISMYTEXT", "JJBGWVLBNHGDHGD"]	//text + specified key

			//or decrypt, using CSPRNG
		console.log(prng.seed('My_super_secret_start_seed'));					//set start seed
		//decrypt cyphertext without specify key (key generated, using CSPRNG):
		console.log(prng.progress_string('Encrypt', "BLRRNHUMVWEC"));			// ["THISISMYTEXT", "SMZDFVYUGSTR"]	//text + CSPRNG key
		console.log(prng.progress_string('', "▲KOJU▲OHHZ▲ODRQ"));				// ["THISISMYTEXT", "JJBGWVLBNHGD"]	//text + CSPRNG key
		
//		Same for another cipher algorithms:
		console.log( prng.param_set('algo', 	'vernam') );
		console.log( prng.param_set('algo', 	'shifted_atbash') );
		console.log( prng.param_set('algo', 	'beaufort') );
		console.log( prng.param_set('algo', 	'atbash') );		//no need any key, just alphabet, and this can be shuffled.

//9.	Encrypt/decrypt strings, with CSPRNG key or with specified key for not reversive cipher algorithms:
		//console.log( prng.symbol('', '', '', 'tritemius') );
		//console.log( prng.symbol('', '', '', 'gronsfeld') );
		//console.log( prng.symbol('', '', '', 'vizhener') );
//		Just specify encrypt or decrypt option in first parameter.
		
//		Example:
		console.log( prng.param_set('algo', 		'gronsfeld') );						//ONLY DIGITS FOR GRONSFELD KEY
		console.log( prng.param_set('alphabet', 	'ABCDEFGHIJKLMNOPQRSTUVWXYZ') );

		//encrypt with CSPRNG generated key
		console.log( prng.seed('My_super_secret_start_seed') );	// set start seed
		console.log( prng.progress_string('Encrypt', 		'THISISMYTEXT') );	//["WIRTIUTGBGFY", "319102788285"]		//ciphertext + key
		console.log( prng.progress_string('Encipher', 		'THISISMYTEXT') );	//["XMMXNTNCXHEB", "454551144378"]		//ciphertext + key
		console.log( prng.progress_string('Encalculate', 	'THISISMYTEXT') );	//["YJJTOTOZCHYX", "521161219314"]		//ciphertext + key

		//decrypt with CSPRNG generated key
		console.log( prng.seed('My_super_secret_start_seed') );	// set start seed
		console.log( prng.progress_string('Decalculate',	'WIRTIUTGBGFY') );	//["THISISMYTEXT", "319102788285"]		//text + CSPRNG key
		console.log( prng.progress_string('Decipher', 		'XMMXNTNCXHEB') );	//["THISISMYTEXT", "454551144378"]		//text + CSPRNG key
		console.log( prng.progress_string('Decrypt', 		'YJJTOTOZCHYX') );	//["THISISMYTEXT", "521161219314"]		//text + CSPRNG key

		//decrypt with specified previous gronsfeld key
		console.log( prng.progress_string('Decalculate',	'WIRTIUTGBGFY',	'319102788285'	) );	//["THISISMYTEXT", "319102788285"]
		console.log( prng.progress_string('Decipher', 		'XMMXNTNCXHEB', '454551144378'	) );	//["THISISMYTEXT", "454551144378"]
		console.log( prng.progress_string('Decrypt', 		'YJJTOTOZCHYX', '521161219314'	) );	//["THISISMYTEXT", "521161219314"]
		
		
		//Encrypt with specified short gronsfeld key
		console.log( prng.progress_string('Encalculate',	'THISISMYTEXT', '12345') );	//["UJLWNTOBXJYV", "123451234512"]	//cyphertext + key. Repeat short key up to message length.
		console.log( prng.progress_string('Encipher', 		'THISISMYTEXT', '12345') );	//["UJLWNTOBXJYV", "123451234512"]
		console.log( prng.progress_string('Encrypt', 		'THISISMYTEXT', '54321') );	//["YLLUJXQBVFCX", "543215432154"]

		//decrypt with specified previous short gronsfeld key
		console.log( prng.progress_string('Decrypt',		'UJLWNTOBXJYV', '12345') );				//["THISISMYTEXT", "123451234512"]	//short key will be repeated automatically.
		console.log( prng.progress_string('Decipher', 		'UJLWNTOBXJYV', '123451234512') );		//["THISISMYTEXT", "123451234512"]	//full key used for decryption with the same result
		console.log( prng.progress_string('Decalculate', 	'YLLUJXQBVFCX', '54321') );				//["THISISMYTEXT", "543215432154"]	//second short key return the same text.
		
//________________________________________________________________________________________________________________________________________
//That's all.

*/


	//start alphabet
	var alphabet =
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЬЪЫЭЮЯабвгдеёжзийклмнопрстуфхцчшщьъыэюя .,!?-[]()/"+
		(
			//symbols esaped with backslash
			"\\"+"\n"
		);
	//var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";	//or like in enigma - 26 letters

//XOR_char for vernam key
/*
	Vernam cipher using XOR.
	This working good when alphabet length is equal of 2^N (2^N-1, including 0);
	So, when alphabet length is 2^N, for example 32 symbols (2^5), XOR can working good.
	But for alphabets with length not equal 2^N need XOR_char.
		Why?
			For example, alphabet is:
			var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			and alphabeg.length = 26;
			Encrypted symbol code = 25 (decimal) = 11001 (binary);
			key = 00100 (binary) = 4 (decimal)
			encrypted symbol: 11001 XOR 00100 = 11101 (binary) = 29 (decimal) - after alphabet.
		How to resolve this?
			1. 	Don't XOR to values, up to max value before alphabet length, and equals 2^N.
				As you can see, vernam key with value 00100 have 5 bits,
				but must to have 4 bits. (2^4) = 16 - 1 = 15 (including 0)
				That means key can have value from 0 to 1111 maximum.
				
			2.	When symbol code 11001 or result 11101 > 1111
				Just XOR this to 10000 and add XOR_char which not contains in alphabet.
				Then add result.
				Example:
					11001 XOR 0100 = (11001>1111) XOR 0100 =
					XOR_char + (11001 XOR 10000) XOR 0100 =
					XOR_char + 01001 XOR 0100 =
					XOR_char + 01001 XOR 0100 =
					XOR_char + 1101.
			3. When XOR_char found, XOR at 10000 again:
				XOR the result:
					XOR_char + 1101 XOR 0100 = 
					(1101 XOR 10000) XOR 0100 = 
					11101 XOR 10000 XOR 0100 = 11001
				Or XOR the symbol:
					XOR_char + 1101 XOR 0100 = 
					1101 XOR 0100 = 
					1001 XOR (10000) = 11001
		
		In this case Vernam cypher can be used for custom alphabets with any alphabet.length
*/
	//for vernam mode need to define this variables:
	var alphabet_length;						//current lenght of alphabet
	var as_binary_string;						//length, as binary string
	var binary_digits;							//number of binary digits
	var minus_left_one;							//nulled left one.
	var minus_left_one_to_bin_string;			//As binary string.
	var minus_left_one_to_bin_string_length;	//max bitlength.
	var ones;									//max value for XOR
	var ones_bin_string;						//bitlength ones binary string
	var N_pow_2;								//ones + 1 symbol (100...0, 2^N) - for additional XOR
	var wait_next_symbol;						//true if need to wait next symbol, after XOR_char
	var XOR_char;								//XOR_char value
	var default_XOR_char = '�';					//if previous undefined - use this value. It's any char which not contains in alphabet '�', '▲', '+', '*', '♥', etc...
	var insert_symbol;							//true when XOR_char was been inserted.

	//function to update variables for vernam successfully XOR
	function set_VERNAM_variables_for_XOR(){
		//for vernam mode need to calculate the following variables:
		alphabet_length = alphabet.length-1;										//-1 symbol (first symbol, as XOR_char)
		as_binary_string = alphabet_length.toString(2);								//length, as binary string
		binary_digits = as_binary_string.length;									//number of binary digits
		minus_left_one = (alphabet_length>>1);										//nulled left one.
		minus_left_one_to_bin_string = (alphabet_length>>1).toString(2);			//As binary string.
		minus_left_one_to_bin_string_length = minus_left_one_to_bin_string.length;	//bitlength.
		ones = (Math.pow(2, minus_left_one_to_bin_string_length)-1)					//bitlength ones
		ones_bin_string = ones.toString(2);											//bitlength ones binary string
		N_pow_2 = ones+1;															//ones + 1 symbol (1000000, 2^N)

		//show this all
		//	console.log(
		//			'\nalphabet_length', alphabet_length
		//		,	'\ntoString(2)', as_binary_string
		//		,	'\ntoString(2).length', binary_digits
		//		,	'\nalphabet_length>>1', minus_left_one
		//		,	'\n(alphabet_length>>1).toString(2)', minus_left_one_to_bin_string
		//		,	'\n(alphabet_length>>1).toString(2).length', minus_left_one_to_bin_string_length
		//		,	'\nMath.pow(2, (alphabet_length>>1).toString(2).length)', ones
		//		,	'\nMath.pow(2, (alphabet_length>>1).toString(2).length)', ones_bin_string
		//	);

		wait_next_symbol = false;
		XOR_char = XOR_char || default_XOR_char;
		insert_symbol = false;
	}

	function param_get(param){
		if(typeof param !== 'undefined'){
			if(param === 'algo') return algo;
			else if(param === 'algos') return modes;
			else if(param === 'alphabet') return alphabet;
			else if(param === 'XOR_char') return XOR_char;
		}
	}
	function param_set(param, value){
		if(typeof param !== 'undefined'){
			if(param === 'algo'){
				algo = value;
				if(algo==='vernam'){set_VERNAM_variables_for_XOR();}
				console.log('algo updated: ', algo, ( (algo === 'vernam') ? ', XOR_char: '+XOR_char : '' ) );
				return algo;
			}
			if(param === 'alphabet'){
				alphabet = value.split('').filter(function(item, i, ar){ return ar.indexOf(item) === i; }).join(''); //only unique symbols.
				if(algo==='vernam'){set_VERNAM_variables_for_XOR();}
				//console.log('alphabet updated: ', alphabet);
				return alphabet;
			}
			if(param === 'XOR_char'){
				XOR_char = value;
				console.log('XOR_char', XOR_char);
				return XOR_char;
			}
		}
	}
	








	//encrypt-decrypt
	function symbol(m, param, key, change_algo, change_alphabet, Vernam_XOR_symbol){	//m - message symbol, param - encrypt/decrypt, key - custom symbol from key;
		if(typeof change_algo !== 'undefined' && modes.indexOf(change_algo)!==-1 ){
			param_set('algo', change_algo)
			return change_algo;
		}
		else if(typeof change_alphabet !== 'undefined' && alphabet.length !==0 ){
			param_set('alphabet', change_alphabet);
			return change_alphabet;
		}
		else if(
			typeof Vernam_XOR_symbol !== 'undefined'
		){
			var notify = 'Special symbol for XOR (vernam cipher) was been changed to symbol: ';
			if(Vernam_XOR_symbol.length === 1 && alphabet.indexOf(Vernam_XOR_symbol)===-1){
				param_set('XOR_char', Vernam_XOR_symbol);
				console.log(notify, XOR_char);
				return XOR_char;
			}else if(Vernam_XOR_symbol.length===0 || Vernam_XOR_symbol.length > 1 || alphabet.indexOf(Vernam_XOR_symbol)!==-1){
				if(Vernam_XOR_symbol.length > 1){
					console.log('maximum one character for XOR_char. Current length = ', Vernam_XOR_symbol.length);
				}
				param_set('XOR_char', default_XOR_char);			//set default XOR_char if string was been empty.
				console.log(notify, XOR_char);
				return XOR_char;
			}else{
				console.log('Another case for XOR_char; return false;');
				return false;
			}
		}
		if(typeof key !== 'undefined'){					//if key specified
			if(typeof key === 'string'){				//and if this symbol is string
				var index =
					(	
						( algo === 'gronsfeld' )		//if gronsfeld key
							?
								parseInt(key)			//get digit from numeric gronsfeld key, if this was been numeric string
								//alphabet.indexOf(key)	//or get index of this symbol from alphabet, if this was been encoded as letters.
							:
								alphabet.indexOf(key)	//or get index of this symbol from alphabet
					)
				;
				if(index===-1){							//if not found, maybe this is number as string
					key = parseInt(key);				//parseInt of this number
				}else{
					key = index;						//else key = index of specified symbol
				}
			}
		}
		if( algo === 'atbash' ){	//atbash for one symbol
			//just atbash
			return [ ( alphabet[ alphabet.length-1 - alphabet.indexOf(m) ] ), '' ];
		}
		else if( algo === 'vernam' ){
			//Vernam cipher - with spesial_symbol:
			var index = alphabet.indexOf(m);											//index of input symbol
			var k;																		//define k
			if(index === -1){															//if symbol not found in alphabet
				if(m === XOR_char){
					wait_next_symbol = true;
					return ['', ''];		//return empty string as cyphertext and key
				}																		//If this was been XOR_char - return empty string and wait next symbol
				else{																	//else
					var error = 'symbol '+m+' not found in alphabet: '+alphabet;
					console.log(error);													//show error
					return error;														//return error
				}
			}

			k = (typeof key === 'undefined') ? range(0, alphabet.length-1) : key;	//key up to alphabet.length-1
			var xorred = index ^ k;														//XOR indexes.
			if( (xorred > alphabet.length-1) && (wait_next_symbol === false) ) {		//If index greater than alphabet.length
				xorred = xorred ^ Math.pow(2, minus_left_one_to_bin_string_length);		//discard greatest one bit in the number
				insert_symbol = true;													//set this as true
			}
			xorred =
				(wait_next_symbol === true)												//If need to wait next symbol
					? (Math.pow(2, minus_left_one_to_bin_string_length) ^ xorred)		//add greatest one bit to the number
					: xorred;															//or return result
			if(wait_next_symbol === true){ wait_next_symbol = false; }					//if need to wait next symbol - no need to wait now.
			var result_symbol =
				(insert_symbol===true)													//if need to insert symbol
					? XOR_char + alphabet[xorred]							//add this to cyphertext
					: alphabet[xorred];													//or just add result symbol
			if(insert_symbol===true){ insert_symbol=false; }							//If need to insert symbol - no need to insert now.
			return [	result_symbol, alphabet[k]	];									//Return result symbol (or two, including XOR_char)
		}
		else if( algo === 'tritemius' ){
			//Tritemius cipher
			var index = alphabet.indexOf(m);												//index
			var k = (typeof key === 'undefined') ? range(0, alphabet.length-1) : key;	//generate key up to alphabet.length
			if(typeof param === 'undefined' || param.indexOf('En')!==-1){		//[En]cipher, [En]crypt
				k = k;													//add for encipher
			}else if(typeof param !== 'undefined' && param.indexOf('De')!==-1){	//[De]cipher, [De]crypt
				k = -k;													//subtract for decipher
			}
			var L = ((index + k)+alphabet.length) 	% alphabet.length;	//result code.
			return [	alphabet[L], 	alphabet[k]	];											//return result symbol
		}
		else if( algo === 'vizhener' || algo === 'beaufort' || algo === 'gronsfeld' || algo === 'shifted_atbash'){
			//shifted_atbash, Vizhener, Beaufort, Gronsfeld
			var a = alphabet;
			var mode = param;
			var mi = a.indexOf( m );	//index of symbol
			var ki_s = (typeof key === 'undefined') ? bytes(1)[0] : key ;
			var ki = (algo === 'gronsfeld') ? (ki_s % 10) : (ki_s % alphabet.length);
			if(algo === 'beaufort'){	//for Beaufort cipher
				mode = 'Decipher';		//usning Vigener cipher and decrypt only mode - for each encrypt and decrypt operation.
				var x = ki;				//exchange
				ki = mi;				//key index
				mi = x;					//and message index
			}
			var key_index = ( (typeof mode !== 'undefined' && mode.indexOf('De') !== -1) ?(-ki) :ki );	//[De]crypt, [De]cipher - negative; [En]crypt, [En]cipher - positive
			var c = a[ ( ( ( a.length + ( mi + key_index ) ) % a.length ) ) ];							//Symbol by Vigenere table.
			c = (algo === 'shifted_atbash') ? a[ a.length-1-a.indexOf(c) ] : c;							//Atbash for symbol or just symbol.
			return 	[
						c, 	(
								( algo === 'gronsfeld' )
									?
										ki				//numeric gronsfeld key
										//alphabet[ki]	//or key, encoded as letters from alphabet.
									:
										alphabet[ ( (algo === 'beaufort') ? mi : ki ) ]
							)
					];	//Return two symbols - cyphertext and key.
		}
	}	//return [(cyphertext symbol), (key symbol)].


















	//progress string(s)
	function progress_string(param, text_cypher, key, change_algo, change_alphabet, Vernam_XOR_symbol){
		if(typeof change_algo !== 'undefined' || typeof change_alphabet !== 'undefined' || typeof Vernam_XOR_symbol !== 'undefined'){
			return symbol(undefined, undefined, undefined, change_algo, change_alphabet, Vernam_XOR_symbol);
		}

		if(modes.indexOf(param)!==-1){
			algo = modes[modes.indexOf(param)];
			//console.log('current algo: '+algo);
		}

		var out = '';
		
		var key = (typeof key === 'undefined') ? '' : key;
		
		var key_length = key.length;
		var XOR_chars_count = 0;
		
		var text_cypher_length = (typeof text_cypher !== 'undefined') ? text_cypher.length : 0;
		for(var i=0; i<text_cypher_length; i++){
			if(algo==='vernam' && text_cypher[i] === XOR_char){
				symbol(text_cypher[i], param, '');	//to wait next symbol
				XOR_chars_count++;			//skip this XOR_char
				continue;							//and continue
			}

			var result =
				symbol(
					text_cypher[i],
					param,
					(typeof key === 'undefined')
						? undefined
						: key[
							( ( ( i-XOR_chars_count ) >= key_length )		//shift index
								? ( i - XOR_chars_count ) % key_length	//if key is so small, repeat this
								: ( i - XOR_chars_count )					//or current index without skiped indexes
							)
						]
				);

			out += result[0];							//cipher
			key += (i >= key.length) ? result[1] : '';	//key
		}
		return [out, key];
	}

	






	//TEST
function test(){

	//generate string, using csPRNG values.
	var string = '';
	for(var i=0; i<100;i++){ //generate 100 pseudorandom characters.
		var character = alphabet[range(0, alphabet.length-1)];	//with symbols corresponding for pseudorandom generated index in alphabet.
		//console.log('character', character);
		string += character;	//add this char to string
	}
	console.log('string', string);


//Test reversive ciphers
	//Vernam encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'vernam';
	
	progress_string(	undefined,	undefined,	undefined,	'vernam',	undefined,	undefined	);	//set vernam algo
	progress_string(	undefined,	undefined,	undefined,	undefined,	undefined,	"+"			);	//set XOR_char
	
	var vernam_encrypt = '';
	for(i=0; i<string.length; i++){
		var character = this.symbol(string[i])[0];
		vernam_encrypt += character;
	}
	algo = '';
	console.log('vernam_encrypt', vernam_encrypt, 'vernam_encrypt.length', vernam_encrypt.length);

	//Vernam decrypt
	seed('start_seed');
	algo = 'vernam';
	var vernam_decrypt = '';
	for(i=0; i<vernam_encrypt.length; i++){
		var character = this.symbol(vernam_encrypt[i])[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		vernam_decrypt += character;
	}
	algo = '';
	
	//Vernam test
	console.log(
		'Vernam: ( vernam_decrypt === string )',
					(
						( vernam_decrypt === string )
							? true
							: ('\nvernam_encrypt', vernam_encrypt, '\nvernam_decrypt', vernam_decrypt)
					)
	);

	
	//Shifted_atbash encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'shifted_atbash';
	var shifted_atbash_encrypt = '';
	for(i=0; i<string.length; i++){
		var character = this.symbol(string[i])[0];
		shifted_atbash_encrypt += character;
	}
	algo = '';
	console.log('shifted_atbash_encrypt', shifted_atbash_encrypt, 'shifted_atbash_encrypt.length', shifted_atbash_encrypt.length);
	
	
	//shifted_atbash decrypt
	seed('start_seed');
	algo = 'shifted_atbash';
	var shifted_atbash_decrypt = '';
	for(i=0; i<shifted_atbash_encrypt.length; i++){
		var character = this.symbol(shifted_atbash_encrypt[i])[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		shifted_atbash_decrypt += character;
	}
	algo = '';

	console.log(
		'Shifted_atbash: ( shifted_atbash_decrypt === string )',
					(
						( shifted_atbash_decrypt === string )
							? true
							: ('\nshifted_atbash_encrypt', shifted_atbash_encrypt, '\nshifted_atbash_decrypt', shifted_atbash_decrypt)
					)
	);


	//Beafort encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'beaufort';
	var beaufort_encrypt = '';
	for(i=0; i<string.length; i++){
		var character = this.symbol(string[i])[0];
		beaufort_encrypt += character;
	}
	algo = '';
	console.log('beaufort_encrypt', beaufort_encrypt, 'beaufort_encrypt.length', beaufort_encrypt.length);

	//Beufort decrypt
	seed('start_seed');
	algo = 'beaufort';
	var beaufort_decrypt = '';
	for(i=0; i<beaufort_encrypt.length; i++){
		var character = this.symbol(beaufort_encrypt[i])[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		beaufort_decrypt += character;
	}
	algo = '';

	//Beufort test
	console.log(
		'Beaufort: ( beaufort_decrypt === string )',
					(
						( beaufort_decrypt === string )
							? true
							: ('\nbeaufort_encrypt', beaufort_encrypt, '\nbeaufort_decrypt', beaufort_decrypt)
					)
	);
	
	
	//Atbash encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'atbash';
	var atbash_encrypt = '';
	for(var symbol=0; symbol<string.length; symbol++){
		var character = this.symbol(string[symbol])[0];
		atbash_encrypt += character;
	}
	algo = '';
	console.log('atbash_encrypt', atbash_encrypt, 'atbash_encrypt.length', atbash_encrypt.length);


	//Atbash decrypt
	seed('start_seed');
	algo = 'atbash';
	var atbash_decrypt = '';
	for(symbol=0; symbol<atbash_encrypt.length; symbol++){
		var character = this.symbol(atbash_encrypt[symbol])[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		atbash_decrypt += character;
	}
	algo = '';
	
	//Atbash test:
	console.log(
				'Atbash: ( atbash_decrypt === string )',
					(
						( atbash_decrypt === string )
							? true
							: ('\natbash_encrypt', atbash_encrypt, '\natbash_decrypt', atbash_decrypt)
					)
	);

//Test not-reversive ciphers
	//Tritemius encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'tritemius';
	var tritemius_encrypt = '';
	for(i=0; i<string.length; i++){
		var character = this.symbol(string[i])[0];
		tritemius_encrypt += character;
	}
	algo = '';
	console.log('tritemius_encrypt', tritemius_encrypt, 'tritemius_encrypt.length', tritemius_encrypt.length);
	
	
	//Tritemius decrypt
	seed('start_seed');
	algo = 'tritemius';
	var tritemius_decrypt = '';
	for(i=0; i<tritemius_encrypt.length; i++){
		var character = this.symbol(tritemius_encrypt[i], 'Decipher')[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		tritemius_decrypt += character;
	}
	algo = '';
	
	//Tritemius test	
	console.log(
					'Tritemius: ( tritemius_decrypt === string )',
					(
						( tritemius_decrypt === string )
							? true
							: ('\ntritemius_encrypt', tritemius_encrypt, '\ntritemius_decrypt', tritemius_decrypt)
					)
	);
	
	
	//Gronsfeld encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'gronsfeld';
	var gronsfeld_encrypt = '';
	for(i=0; i<string.length; i++){
		var character = this.symbol(string[i])[0];
		gronsfeld_encrypt += character;
	}
	algo = '';
	console.log('gronsfeld_encrypt', gronsfeld_encrypt, 'gronsfeld_encrypt.length', gronsfeld_encrypt.length);
	
	
	//Gronsfeld decrypt
	seed('start_seed');
	algo = 'gronsfeld';
	var gronsfeld_decrypt = '';
	for(i=0; i<gronsfeld_encrypt.length; i++){
		var character = this.symbol(gronsfeld_encrypt[i], 'Decipher')[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		gronsfeld_decrypt += character;
	}
	algo = '';
	
	//Gronsfeld test
	console.log(
						'Gronsfeld: ( gronsfeld_decrypt === string )',
						(
							( gronsfeld_decrypt === string )
								? true
								: ('\ngronsfeld_encrypt', gronsfeld_encrypt, '\ngronsfeld_decrypt', gronsfeld_decrypt)
						)
	);
	
	
	//Vizhener encrypt
	console.log('\n\n\n');
	seed('start_seed');	//set some seed-string for encrypt
	algo = 'vizhener';
	var vizhener_encrypt = '';
	for(i=0; i<string.length; i++){
		var character = this.symbol(string[i])[0];
		vizhener_encrypt += character;
	}
	algo = '';
	console.log('vizhener_encrypt', vizhener_encrypt, 'vizhener_encrypt.length', vizhener_encrypt.length);
	
	//Vizhener decrypt
	seed('start_seed');
	algo = 'vizhener';
	var vizhener_decrypt = '';
	for(i=0; i<vizhener_encrypt.length; i++){
		var character = this.symbol(vizhener_encrypt[i], 'Decipher')[0];				//тест варианта с заменяющим символом и расширенным полем. Работает.
		vizhener_decrypt += character;
	}
	algo = '';
	
	//Vizhener test
	console.log(
				'Vizhener: ( vizhener_decrypt === string )',
						(
							( vizhener_decrypt === string )
								? true
								: ('\nvizhener_encrypt', vizhener_encrypt, '\nvizhener_decrypt', vizhener_decrypt)
						)
	);
	console.log('End tests...\n\n\n');
}
//RUN TESTS
//	test();		//See console.log();


//END CIPHERS BLOCK



        /* return class object */
        return {
              'bytes'     		: 	bytes
            , 'chars'     		: 	chars
            , 'decipher'  		: 	decipher
            , 'double'    		: 	double
            , 'encipher'  		: 	encipher
            , 'export'    		: 	get
            , 'import'    		: 	set
            , 'int32'     		: 	int32
            , 'internals' 		: 	internals
            , 'prng'      		: 	prng
            , 'rand'      		: 	rand
            , 'range'     		: 	range
            , 'random'    		: 	random
            , 'reset'     		: 	reset
            , 'seed'      		: 	seed
            , 'version'   		: 	version
			, 'skip_bytes'		:	skip_bytes
			
			//7 CYPHERS (strings and symbols encryption/decryption with custom or CSPRNG keys)
				//Reversive (one button for encrypt/decrypt): 			| Vernam   | Shifted atbash  | Beaufort   | Atbash	 |
				//Not Reversive (two buttons for encrypt and decrypt): 	| Tritemius   | Gronsfeld	  | Vizhener   | 
			, 'symbol'			:	symbol				//symbol_by_symbol encrypt/decrypt, update algo, update alphabet, update XOR_char
			, 'progress_string'	:	progress_string		//string encrypt/decrypt, update algo, update alphabet, update XOR_char
			, 'param_get'		:	param_get			//param_get(param): algo, alphabet, XOR_char
			, 'param_set'		:	param_set			//param_set(param, value): algo, alphabet, XOR_char
			//See commented USAGE here. You can uncomment it and see console.log( F12 button ), then.
			, 'test'			:	test				//run tests all ciphers. "var prng = isaacCSPRNG(); prng.test();"
        };
     
    })( specifiedSeed );
};
