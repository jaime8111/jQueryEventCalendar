module.exports = function(grunt) {
// Project configuration.
    grunt.initConfig({

        sass: {
            dist: {
                options: {
                    style: 'expanded'
                },//options

                files: {
                    'scss/css/eventCalendar.css': 'scss/eventCalendar.scss',
                    'scss/css/eventCalendar_theme_responsive.css': 'scss/eventCalendar_theme_responsive.scss'
                }
            }//dist

        },//sass
        watch: {
            options: { livereload: false },
            sass: {
                files: ['scss/**/*.scss'],
                tasks: ['sass:dist']
            }//sass

        }//watch


    });//initConfig

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.registerTask("default", ['watch']);


};