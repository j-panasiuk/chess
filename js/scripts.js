'use strict';

var LOG = {
    action: "color:SlateBlue",
    state: "color:BlueViolet; font-style:italic",
    ui: "color:SandyBrown",
    valid: "color:LimeGreen",
    promise: "color:CornflowerBlue",
    warn: "color:DarkOrange",
    attention: "color:Fuchsia; font-weight:bold; line-height:200%;"
};

//console.log('%cExtending prototypes...', LOG.action);
//  *** EXTEND PROTOTYPES
//  -----------------------------------------------------------------
//  Squares on the chessboard are represented by numbers (integers).
//  Chess pieces also have their simplified number representations.
//  Finally, numbers are used to represent special move values.
//  Extend Number.prototype by additional functionalities.
Object.defineProperties(Number.prototype, {
    "onBoard":    		{ get: function() { return !(this.valueOf() & 0x88); } },
    "rank":             { get: function() { return this.valueOf() >> 4; } },
    "file":             { get: function() { return this.valueOf() % 16; } },
    "pieceType":        { get: function() { return this.valueOf() & 7; } },
    "pieceColor":       { get: function() { return +!!(this.valueOf() & 8); } }
});
Object.defineProperty(Number.prototype, 'complex', {
    get: function() { return (this.file + this.rank) % 2 ? 'light' : 'dark'; }
});

//  Arrays are frequently used to store rays and other sets of squares.
//  Extend Array.prototype by addotional functionalities.
Object.defineProperty(Array.prototype, 'shiftSquares', {
    value: function(vector) {
        console.assert(!isNaN(vector) && (Math.abs(vector)).onBoard, 'Can only shift by a coordinate.');
        var shifted = this.map(function(element) {
            return element + vector;
        }).filter(function(element) {
            return element.onBoard;
        });
        return shifted;
    }
});

Object.defineProperty(Array.prototype, 'isRay', {
    value: function() {
        return this.every(function(element) { return element.onBoard; });
    }
});

Object.defineProperty(Array.prototype, 'isDiagonal', {
    value: function() {
        var vector;
        if ((this.length < 2) || (!this.isRay())) { 
            return false; 
        }
        vector = Math.abs(this[1] - this[0]);
        return !!((vector === 15) || (vector === 17));
    }
});