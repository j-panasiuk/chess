describe('Settings service:', function() {
    var settingsService;

    beforeEach(function() {
        module('app');
        inject(function(settings) {
            settingsService = settings;
        });
    });

    it('should be loaded', function() {
        expect(settingsService).toBeDefined();
    });

    it('should be set to default', function() {
        expect(settingsService.controlWhite).toEqual(1);
        expect(settingsService.controlBlack).toEqual(2);
        expect(settingsService.difficulty).toEqual(0);
        expect(settingsService.isReversed).toEqual(false);
    });

});

describe('Rules service:', function() {
    var settingsService;

    beforeEach(function() {
        module('app');
        inject(function(rules) {
            rulesService = rules;
        });
    });

    it('should be loaded', function() {
        expect(rulesService).toBeDefined();
    });

    it('should be set to default', function() {
        expect(rulesService.COLORS).toEqual([0, 1]);
        expect(angular.isFunction(rulesService.createPosition)).toBe(true);
    });

});