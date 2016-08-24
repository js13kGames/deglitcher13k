/*
 *    glitch.js for deglitcher13k
 *    Copyright 2016 by Dustin Pfister (GPL v3)
 *
 *    used for glitch effects based on the number of glitches.
 *
 */

var glitchIt = (function () {

    var lastGlitch = new Date(),
    glitchRate = 100,

    effects = [

        // x gets set to 0, or home
        function (button) {

            if (button.x === button.homeX) {

                button.x = 10;

            } else {

                button.x = button.homeX;

            }

        },

        // random x,y location
        function (button) {

            button.x = Math.round(Math.random() * (640 - button.w));
            button.y = Math.round(Math.random() * (480 - button.h));

        }

    ];

    return function () {

        var roll,

        maxEffect = Math.floor(game.pubState.level / 100 * 10);

        if (maxEffect > effects.length) {

            maxEffect = effects.length;

        }

        console.log(maxEffect);

        if (new Date() - lastGlitch >= glitchRate) {

            game.pubState.buttons.forEach(function (button) {

                roll = Math.random();

                if (roll > 0.9) {

                    effects[Math.floor(Math.random() * maxEffect)](button);
                }

            });

            lastGlitch = new Date();

        }

    };

}

    ());
