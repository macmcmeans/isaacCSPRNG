# isaacCSPRNG
ISAAC is a *cryptographically secure* pseudo-random number generator (CSPRNG) created by Robert J. Jenkins Jr., in 1996, based on RC4. Designed for speed and security, ISAAC (Indirection, Shift, Accumulate, Add, and Count) generates 32-bit random numbers. On average, cycles are are 2^8295 values long, and are guaranteed to be at least 2^40 values long. The results are uniformly distributed, unbiased,
and unpredictable unless you know the seed.

Internally, this implementation is largely Rinquin's logic which appears to be quite similar to Jenkins' original work (in C) which he released into the Public Domain. My contributions are a namespace, so that separate instances may be created; as well as helper functions to spit out random bytes, and random strings, of desired lengths. Going further, my int32, double and range methods expand the output options from the orginal random and rand methods; and where Rinquin extends the String object, my version uses separate functions in lieu of extending the native prototype. Since ISAAC is a CSPRNG, I added logic to directly perform simple vernam (XOR) encryption. As an academic option, I created the ability to save and set the generator's internal state via JSON. Lastly, unseeded instances will internally set themselves with a default seed from Window.crypto values, which would be suitable for Monte Carlo simulations where deterministic output is not required.

There are surprisingly few JavaScript examples of this CSPRNG. Considering it's over 20 years old, and has never been proven broken, one would expect more mention of it.

isaacCSPRNG is emoji-friendly 😀😆😊😵, which is to say that seeds, cipher keys and plaintexts are multi-byte Unicode-safe.

<br>&nbsp;<br>
Version 1.1<br>
Author: William P. "Mac" McMeans<br>
Date: 3 MAY 2018
<br>&nbsp;<br>


## Application:
Use this to generate high-quality random numbers, and to encipher discrete messages (vernam). It also creates arbitrary length byte arrays and text strings. Note: This generator is cryptographically secure. If you don't need a secure generator then consider <a href="https://github.com/macmcmeans/aleaPRNG">ALEA</a> for your application, an RNG created by Johannes Baagøe having excellent statistical properties.


## Dependencies:
None.
<br>&nbsp;<br>


## Period:
Average 2^8295; not less than 2^40
<br>&nbsp;<br>


## Example usage:

```
// return an instance of the generator initialized internally with Window.crypto (Monte Carlo)
> prng0 = isaacCSPRNG();


// return a 32-bit fraction in the range [0, 1]
> prng0.random();                                 -->  some random value


// return an instance of the generator initialized with a specified seed (deterministic)
> prng1 = isaacCSPRNG( 'this is a test' );


// return a 32-bit fraction in the range [0, 1]
> prng1.random();                                 -->  0.9519342305138707


// return a signed random integer in the range [-2^31, 2^31]
> prng1.rand();                                   -->  2052729692


// advance the generator the specified number of cycles
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


// return an array of random bytes
> prng1.bytes( 10 );                              -->  (10) [192, 182, 240, 253, 228, 223, 55, 207, 168, 102]


// return a string of random 7-bit ASCII graphemes
> prng1.chars( 10 );                              -->  "<3%;&mK6GH"


// return vernam encryption of plaintext message, in hex format
> secret = prng1.encipher( 'key', 'message', 1 )  -->  "002900470041003b0021001e003f"

// return vernam decryption of ciphertext message, from hex-formatted data
> prng1.decipher( 'key', secret, 1 )              -->  "message"


// return vernam encryption of plaintext message (raw XOR)
> secret = prng1.encipher( 'key', 'message' )     -->  ")GA;!?"

// return vernam decryption of ciphertext message
> secret = prng1.encipher( 'key', secret )        -->  "message"


// export an object that describes the generator's internal state
> state = prng1.export();                         -->  JSON


// import an object that will set the generator's internal state
> prng1.import( state );


// zeroize the generator
> prng1.reset();


// re-seed existing generator (with a sample Gujarati phrase)
> prng1.seed( 'પ્રિઝમ સાઇફર' );


> prng1.random();                                 -->  0.22731631994247437


// re-instantiate the prng1 generator with a seed (emoji and script pseudo-alphabet)
> prng1 = isaacCSPRNG( '⛄⚽🙈𝓾𝓷𝓲𝓬𝓸𝓭𝓮' );


// range parameters can be given in either order
> prng1.range( 10, -20);                          -->  -15


// return ciphertext message, in hex (using Malayalam, Bengali, emoji and Unicode math symbols)
> secret = prng1.encipher( '𝙠𝙚𝙮 ⚷🔑⚿ എൻക്രിപ്റ്റ് ചെയ്യുക', '𝖒𝖊𝖘𝖘𝖆𝖌𝖊 📧 📩 💌 📬 প্রিজম সাইফার', true );  -->
"d810ddabd85ddda7d804ddd8d84dddeed86adde7d813ddafd842ddbe005cd810dcd70019d81fdcbf0014d803dcb20049d85cdca2004009cf09a0099b09de09ae09fe005d099f099609a209c609fd09dc"


// restore the plaintext (from hex input)
> prng1.decipher( '𝙠𝙚𝙮 ⚷🔑⚿ എൻക്രിപ്റ്റ് ചെയ്യുക', secret, true );  -->
"𝖒𝖊𝖘𝖘𝖆𝖌𝖊 📧 📩 💌 📬 প্রিজম সাইফার"

```
NOTE: Specifiying a seed on generator instantiation, or using the seed() method, or using either of the encipher() or decipher() methods will all produce the same effect of specifically setting the generator's internal seed. In the case of enciphering/deciphering, the key is the seed.
<br>&nbsp;<br>


## REFS:
https://github.com/rubycon/isaac.js/blob/master/isaac.js

http://www.burtleburtle.net/bob/rand/isaacafa.html

http://www.burtleburtle.net/bob/c/readable.c

http://rosettacode.org/wiki/The_ISAAC_Cipher

https://crypto.stackexchange.com/questions/42907/why-is-isaac-not-a-pseudo-random-number-generator
<br>&nbsp;<br>


## Tested:
Google Chrome on Win 8.1 (x64)
<br>&nbsp;<br>

## Version notes:
* 1.1 - 3 MAY 2018<br>
NEW: Add method to expose generator internal state
<br>&nbsp;<br>
* 1.0 - 22 JUL 2017<br>
Initial release
<br>&nbsp;<br>

# License (BSD)
Copyright (c) 2017, 2018 William McMeans

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
