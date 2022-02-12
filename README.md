# isaacCSPRNG [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity) [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[ISAAC](https://en.wikipedia.org/wiki/ISAAC_(cipher)) is a *cryptographically secure* pseudo-random number generator ([CSPRNG](https://en.wikipedia.org/wiki/Cryptographically-secure_pseudorandom_number_generator)), meant to be usable as a [stream cipher](https://archive.is/cOe1D), created by [Robert J. Jenkins Jr.](https://en.wikipedia.org/wiki/Robert_John_Jenkins_Junior), in 1996, based on [RC4](https://en.wikipedia.org/wiki/RC4). Designed for speed and security, ISAAC (Indirection, Shift, Accumulate, Add, and Count) generates 32-bit random numbers. On average, cycles are 2<sup>8295</sup> values long, and are guaranteed to be at least 2<sup>40</sup> values long. The results are uniformly distributed, unbiased, and unpredictable unless you know the seed. Speaking of which, it's the responsibility of the user to seed ISAAC with a strong entropy source.

Internally, my implementation here is largely Rinquin's logic (see [REFS](https://github.com/macmcmeans/isaacCSPRNG/blob/master/README.md#refs)) which appears to be quite similar to Jenkins' original work (in C) which he released into the Public Domain. My contributions are a [namespace](https://archive.is/fqM9P), so that separate instances may be created; as well as helper functions to spit out random bytes, and random strings, of desired lengths. Going further, my *int32*, *double* and *range* methods expand the output options from the orginal *random* and *rand* methods; and where Rinquin extends the String object, my version uses separate functions in lieu of extending the native prototype.

Since this is a CSPRNG, or alternatively, a Deterministic Random Bit Generator (DRBG), I added logic to directly perform simple [vernam](https://en.wikipedia.org/wiki/One-time_pad) (XOR) encryption. As an academic option, I created the ability to get and set the generator's internal state. Lastly, unseeded instances will internally set themselves with a default value from [Window.crypto](https://archive.ph/4h0zE) values, which would be suitable for Monte Carlo simulations where deterministic output is not required.

There are surprisingly few JavaScript examples of ISAAC. Considering it's over 20 years old, and has never been proven broken, one would expect more mention of it.

This generator is emoji-friendly 🧐😲😊👍, which is to say that seeds, cipher keys and plaintexts are multi-byte Unicode-safe.

<br>&nbsp;<br>
Version 1.1<br>
Author: William P. "Mac" McMeans<br>
Date: 3 MAY 2018
<br>&nbsp;<br>


## Application:
Use this to produce high-quality random numbers, and to encipher discrete messages and streams. You may also create arbitrary length byte arrays and text strings of random composition. Note: This generator is cryptographically secure. If you don't need a secure generator then consider <a href="https://github.com/macmcmeans/aleaPRNG">ALEA</a> for your application, an RNG created by Johannes Baagøe having excellent statistical properties.


## Dependencies:
None.
<br>&nbsp;<br>


## Period:
Average 2<sup>8295</sup> (not less than 2<sup>40</sup>)
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
NOTE: Specifiying a seed on generator instantiation, or using the seed() method, or using either of the encipher() or decipher() methods will all produce the same effect of specifically setting the generator's internal seed. In the case of enciphering/deciphering, the key provided becomes the seed.
<br>&nbsp;<br>


## REFS:
https://github.com/rubycon/isaac.js

[http://www.burtleburtle.net/bob/rand/isaacafa.html](https://archive.is/sysF)

[http://www.burtleburtle.net/bob/c/readable.c](https://archive.ph/5Mzx2)

[http://rosettacode.org/wiki/The_ISAAC_Cipher](https://archive.ph/WEctB)

https://crypto.stackexchange.com/questions/42907/why-is-isaac-not-a-pseudo-random-number-generator
<br>&nbsp;<br>


## Tested:
Google Chrome on Win 10 (x64)
<br>&nbsp;<br>

## Version notes:
* 1.1 - 3 MAY 2018<br>
``feature`` Expose generator internal state, set/get
<br>&nbsp;<br>
* 1.0 - 22 JUL 2017<br>
``release`` Initial release
<br>&nbsp;<br>

## Academic papers:
https://eprint.iacr.org/2006/438.pdf
<br>&nbsp;<br>

# License (BSD)
Copyright (c) 2017, 2018 William McMeans

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
