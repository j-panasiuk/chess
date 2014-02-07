describe('Settings service:', function() {
    var $settings;

    beforeEach(function() {
        module('app');
        inject(function(settings) {
            $settings = settings;
        });
    });

    it('should be loaded', function() {
        expect($settings).toBeDefined();
    });

    it('should be have legal values', function() {
        expect(_.values($settings.CONTROL_FLAGS)).toContain($settings.controlWhite);
        expect(_.values($settings.CONTROL_FLAGS)).toContain($settings.controlBlack);
        expect(typeof $settings.difficulty).toEqual('number');
        expect(typeof $settings.isReversed).toEqual('boolean');
        expect(typeof $settings.reverseForBlack).toEqual('boolean');
        expect(typeof $settings.autoRestart).toEqual('boolean');
        expect(typeof $settings.switchColorOnRestart).toEqual('boolean');
    });

});