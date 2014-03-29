/*
 * checkdeps
 * https://github.com/JahPowerBit/checkdeps
 *
 * Copyright (c) 2014 JahPowerBit
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var Crypto = require('cryptojs').Crypto
    var File = require('grunt-usemin/lib/file');
    var Uglify = require("uglify-js");

    var generateHashes = function() {
        var hashes = {};
        var config = grunt.config('checksumdeps');  
        var root = "";
        if (config.root) {
            root = config.root;
        }
        for (var filename in config.html) {
            grunt.log.writeln('filename: '+root+filename);
            var file = new File(root+filename);
            file.blocks.forEach(function(block) {
                grunt.log.writeln('block.dest: '+block.dest+','+block.dest.split("/").pop());

                var blockdest = block.dest.split("/").pop();
                grunt.log.writeln('blockdest: '+blockdest);
                if (config.html[filename][blockdest]) {
                    for (var b in block.src) {
                        grunt.log.writeln('generating hash: '+block.src[b]);
                        var path = root+block.src[b]
                        var content = grunt.file.read(path);                   
                        var ast = Uglify.parser.parse(content); // parse code and get the initial AST
                        ast = Uglify.uglify.ast_squeeze(ast); // get an AST with compression optimizations
                        content = Uglify.uglify.gen_code(ast); // compressed code here
                        var hash = Crypto.SHA256(content);
                        hashes[path] = hash;
                    }
                }
            });  
        } 
        return hashes;
    }

    grunt.registerTask('checkdeps', 'Check dependencies checksums', function() {
        var currenthashes = generateHashes();
        var savedhashes = grunt.file.readJSON("bowerchecksum.json");

        // We do not check if a file is missing
        for (var filename in currenthashes) {
            var currenthash = currenthashes[filename];
            if (!savedhashes[filename]) {
                grunt.fail.fatal("File not found in bowerchecksum.json: "+filename+". Please run 'grunt writechecksum'.");
            } else if (savedhashes[filename]!=currenthash) {
                grunt.fail.fatal("Invalid checksum: "+filename);
            } else {
                grunt.log.writeln("cheksum ok: "+filename);
            }
        }
    });

    grunt.registerTask('writechecksum', 'Generate dependencies checksums', function() {
        var hashes = generateHashes();
        var hashesjs = JSON.stringify(hashes, null, 4);
        grunt.log.writeln("generating bowerchecksum.json");
        grunt.file.write("bowerchecksum.json", hashesjs);
        
    });

};
