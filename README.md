# isaacCSPRNG
ISAAC is a *cryptographically secure* pseudo-random number generator (CSPRNG) designed by Robert J.
Jenkins Jr., in 1996, based on RC4. Designed for speed and security, ISAAC (Indirection, Shift, 
Accumulate, Add, and Count) generates 32-bit random numbers. Cycles are guaranteed to be at least 2^40 
values long, and they are 2^8295 values long on average. The results are uniformly distributed, unbiased,
and unpredictable unless you know the seed.

Internally, this implemntation is mostly Rinquin's logic which appears to be quite similar, but not identical to,
Jenkins' original work (in C) which he released into the Public Domain. My contributions are a
namespace, so that separate instances may be created, as well as helper functions to spit out random
bytes, or random strings, of desired lengths. The int32, double and range methods expand the output options
from Rinquin's original random and rand methods. Since ISAAC is a CSPRNG, I also added helper functions 
to perform simple vernam encryption. As an academic option, I added the ability to save and set the
generator's internal state via JSON, since Rinquin already had an available internals method. Lastly,
I made unseeded instances internally set themselves with a default seed from Window.crypto values.

There are surprisingly few JavaScript examples of this CSRPNG. Considering it's over 20 years old, and 
has never been proven broken, one would expect more mention of it.

<br>&nbsp;<br>
Version 1.0<br>
Author: William P. "Mac" McMeans<br>
Date: 22 JUL 2017
<br>&nbsp;<br>


## Application:
Use this as a secure random number generator and discrete message cipher. ISAAC also produces 
arbitrary amounts of random bytes, or arbitrary string lengths of random ASCII values. 


## Dependencies:
None.
<br>&nbsp;<br>


## Period:
Average 2^8295; not less than 2^40
<br>&nbsp;<br>


## Wiki:
An incomplete <a href="https://github.com/macmcmeans//isaacCSPRNG.js/wiki">wiki is here</a>.
<br>&nbsp;<br>


## Example usage:

```
// return an instance of the generator initialized internally with Window.crypto
> prng1 = isaacCSPRNG();

// return an instance of the generator initialized with a specified seed
> prng1 = isaacCSPRNG( 'this is a test' );


// return a 32-bit fraction in the range [0, 1]
> prng1.random();                                 -->  0.9519342305138707


// return a signed random integer in the range [-2^31, 2^31]
> prng1.rand();                                   -->  2052729692


// advance the generator specified number of cycles
> prng1.prng( 6 );


// return an unsigned random integer in the range [0, 2^32]
> prng1.int32();                                  -->  288117856


// return a 53-bit fraction in the range [0, 1]
> prng1.double();                                 -->  0.4613288596233964


// return 32-bit range (inclusive) //
// from -27 to 400.65
> prng1.range( -27, 400.625 );                    -->  267.45789149729535

// from 0 to 100
> prng1.range( 100 );                             -->  37


// return array of random byte values
> prng1.bytes( 10 );                              -->  (10) [192, 182, 240, 253, 228, 223, 55, 207, 168, 102]


// return string of random 7-bit ASCII characters
> prng1.chars( 10 );                              -->  "-D:4<qTGPR"


// return vernam encryption of message, in hex format
> secret = prng1.encipher( 'key', 'message', 1 )  -->  "002900470041003b0021001e003f"

// return vernam decryption of message, from hex-formatted data
> prng1.decipher( 'key', secret, 1 )              -->  "message"


// return vernam encryption of message
> secret = prng1.encipher( 'key', 'message' )     -->  ")GA;!?"

// return vernam decryption of message
> secret = prng1.encipher( 'key', secret )        -->  "message"


// export an object that stores the generator's internal state
> state = prng1.export();                         -->  JSON


// import an object that will set the generator's internal state
> prng1.import( state );


// zeroize the generator
> prng1.reset();
```

## REFS:
https://github.com/rubycon/isaac.js/blob/master/isaac.js

http://www.burtleburtle.net/bob/rand/isaacafa.html

http://www.burtleburtle.net/bob/c/readable.c

http://rosettacode.org/wiki/The_ISAAC_Cipher
<br>&nbsp;<br>



## Tested:
Google Chrome on Win 8.1 (x64)
<br>&nbsp;<br>

## Version notes:
* 1.0 - 22 JUL 2017

Initial release
<br>&nbsp;<br>

# License (BSD)
Copyright (c) 2017, William P. "Mac" McMeans<br>
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
