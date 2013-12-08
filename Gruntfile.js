module.exports = function(grunt) {

    // ==============================================================
    // Project configuration.
    grunt.initConfig({
        // ----------------------------------------------------------
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        // ----------------------------------------------------------
        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        },
        // ----------------------------------------------------------
        cssmin: {
            minify: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */',
                },
                expand: true,
                cwd: 'src/',
                src: ['*.css'],
                dest: 'dist/',
                ext: '.min.css'
            }
        },
        // ----------------------------------------------------------
        copy: {
            main: {
                files: [
                    { expand: true, cwd: 'src/', src: ['*.js'], dest: 'dist/', filter: 'isFile' },
                    { expand: true, cwd: 'src/', src: ['*.css'], dest: 'dist/', filter: 'isFile' },
                ]
            }
        },
        // ----------------------------------------------------------
        pkg: grunt.file.readJSON('package.json')
        // ----------------------------------------------------------
    });

    // ==============================================================
    // loading ALL the things
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // ==============================================================
    // tasks
    grunt.registerTask('default', ['uglify']);

};