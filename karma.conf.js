// Karma configuration
// Generated on Sat Jan 18 2014 21:15:59 GMT+0100 (Środkowoeuropejski czas stand.)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
    //  vendor libraries
        'lib/js/lodash.min.js',
        'lib/js/angular.min.js',
        'lib/js/angular-mocks.js',
        'lib/js/angular-animate.min.js',
        'lib/js/angular-bootstrap.min.js',
    //  application
        'js/scripts.js',
        'js/app.js',
        'js/services/settings.js',
        'js/services/rules.js',
        'js/services/game.js',
        'js/services/engine.js',
        'js/controllers/main.js',
        'js/controllers/chessboard.js',
        'js/directives/chessboard.js',
    //  test suites
        'test/unit/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
      
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome', 'Firefox'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
