module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            main: {
                files: {
                    'share.min.js': 'src/share.js'
                }
            }
        },
        jshint: {
            main: [
                'Gruntfile.js',
                'src/*.js'
            ]
        },
        usebanner: {
            main: {
                options: {
                    position: 'top',
                    banner: '/**\n * Share.js <%= pkg.version %>\n * https://github.com/ArtemFitiskin/share\n *\n * (c) 2015\n */\n',
                    linebreak: true
                },
                files: {
                    src: [
                        'share.min.js',
                        'share.js'
                    ]
                }
            }
        },
        copy: {
            main: {
                src: 'src/share.js',
                dest: 'share.js'
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', [
        'jshint:main',
        'copy:main',
        'uglify:main',
        'usebanner:main'
    ]);
};