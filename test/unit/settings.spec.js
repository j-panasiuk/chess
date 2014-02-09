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

    it('should have correct defaults', function() {
        expect(_.values($settings.CONTROL_FLAGS)).toContain($settings.controlWhite);
        expect(_.values($settings.CONTROL_FLAGS)).toContain($settings.controlBlack);
        expect(typeof $settings.fen).toEqual('string');
        expect(typeof $settings.isReversed).toEqual('boolean');
        expect(typeof $settings.reverseForBlack).toEqual('boolean');
        expect(typeof $settings.autoRestart).toEqual('boolean');
        expect(typeof $settings.switchColorOnRestart).toEqual('boolean');
        expect(typeof $settings.highlightChecks).toEqual('boolean');
        expect(typeof $settings.highlightLastMove).toEqual('boolean');
        expect(typeof $settings.moveList).toEqual('boolean');
        expect(typeof $settings.moveEvaluation).toEqual('boolean');
    });

    it('should have correct accessor methods', function() {
        expect($settings.all.length).toEqual(_.size($settings.defaultSettings));
        expect(typeof $settings.reset).toEqual('function');
        expect(typeof $settings.switchControls).toEqual('function');
    });

});