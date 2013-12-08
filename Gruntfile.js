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
                    banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                },
                expand: true,
                cwd: 'src/',
                src: ['*.css'],
                dest: 'dist/',
                ext: '.min.css'
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

    // ==============================================================
    // tasks
    grunt.registerTask('default', ['uglify']);

};