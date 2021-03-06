/*
 *    game.js for deglitcher13k
 *    Copyright 2016 by Dustin Pfister (GPL v3)
 *
 *    game.js contains the game model, that is updated, and rendered.
 *
 */

var game = (function () {

    // set bx helper
    var setBX = function (offset) {

        var i = 6,
        rad,
        button;
        while (i--) {

            button = pubAPI.getButton('bx' + i);
            rad = Math.PI * 2 / 6 * i;

            button.homeX = Math.cos(rad + offset) * 100 + 304;
            button.homeY = Math.sin(rad + offset) * 100 + 224;

        }

    };

    // the fix Class
    var Fix = function (fixTime) {

        this.startTime = new Date();
        this.progress = 0;
        this.fixTime = fixTime; //5000 + Math.floor(Math.random() * 55000);

    },

    proto = Fix.prototype;

    proto.update = function () {

        var now = new Date(),
        time = now - this.startTime;

        this.progress = time / this.fixTime;

        if (this.progress >= 1) {

            this.progress = 1;

        }

    };

    // The Worker Class
    var Worker = function () {

        this.fixTime = Math.floor(5000 * Math.random()) + 5000;
        this.maxFix = 1;
        this.fixArray = [];

    };

    proto = Worker.prototype;

    proto.update = function () {

        var i,
        fix;

        if (this.fixArray.length < this.maxFix) {

            this.fixArray.push(new Fix(this.fixTime));

        }

    };

    // public state
    var pubState = {

        wave : 1, // wave and glitch are set by setWave helper
        level : 1,
        glitch : 0,
        gOutOf : 0,
        exp : 0, //Math.pow(10,9),

        // one billion dollars! ( places pinkie up near mouth )
        maxExp : Math.pow(10, 9),

        //selfFix
        selfFix : {

            maxTime : 10000,
            maxCount : 1,
            last : new Date(0),
            multi : false,
            delay : 300,
            fixArray : []

        },

        workers : {

            max : 0,
            current : []// current list of workers

        },

        buttons : []

    },

    // pubState method (used with call): set's self fix values by amount of exp made
    setByExp = function () {

        // progress by Math.log
        var logPro = Math.log(this.exp) / Math.log(this.maxExp);

        // no -Infinity if exp is zero
        logPro = logPro < 0 ? 0 : logPro;

        this.level = Math.floor(299 * Math.pow(logPro, 2)) + 1;

        // set max self fix
        this.selfFix.maxCount = Math.floor(9 * logPro) + 1;

        // set max worker
        this.workers.max = Math.floor(this.level / 3);

    },

    // pubState method (used with call): set the game to the given wave
    setWave = function (wave) {

        this.wave = wave;
        this.glitch = 5 * wave + Math.pow(2, wave - 1);
        this.gOutOf = this.glitch;

        this.buttons.forEach(function (button) {

            button.x = button.homeX;
            button.y = button.homeY;

            console.log(button);

        });

    },

    // pubState method (used with call): what to do on a win
    onWin = function () {

        this.wave += 1;

        this.selfFix.inProgress = [];

        setWave.call(this, this.wave);

    },

    // public API
    pubAPI = {

        pubState : pubState,

        // get a button by its id
        getButton : function (id) {

            var i = pubState.buttons.length;
            while (i--) {

                if (pubState.buttons[i].id === id) {

                    return pubState.buttons[i];

                }

            }

            return {};

        },

        // deglitch a count of glitches
        deglitch : function (count) {

            if (typeof count === 'number' && count > 0) {

                if (pubState.glitch >= count) {

                    pubState.glitch -= count;

                    pubState.exp += count;

                } else {

                    pubState.exp += pubState.glitch;

                    pubState.glitch = 0;

                }

                if (pubState.exp > pubState.maxExp) {
                    pubState.exp = pubState.maxExp;
                }

            }

        },

        // if you want a job done right, you need to do it yourself.
        fix : (function () {

            // game.fix() will start a new fix if one is not in progress.
            var pub = function () {

                var fixTime = pubState.selfFix.maxTime,
                fixPer;

                if (new Date() - pubState.selfFix.last >= pubState.selfFix.delay) {

                    if (pubState.selfFix.fixArray.length < pubState.selfFix.maxCount) {

                        if (pubState.selfFix.multiBonus) {

                            fixPer = pubState.selfFix.fixArray.length / pubState.selfFix.maxCount;

                            fixTime = pubState.selfFix.maxTime - pubState.selfFix.maxTime * .90 * fixPer;

                        }

                        pubState.selfFix.fixArray.push(new Fix(fixTime));

                    }

                    pubState.selfFix.last = new Date();

                }

            };

            // what to do on each frame tick
            pub.tick = function () {

                var i = pubState.selfFix.fixArray.length,
                selfFix;
                while (i--) {

                    selfFix = pubState.selfFix.fixArray[i];

                    selfFix.update();

                    if (selfFix.progress === 1) {

                        pubAPI.deglitch(1);

                        // purge
                        pubState.selfFix.fixArray.splice(i, 1);

                    }

                }

            };

            // return public function to game.fix
            return pub;

        }
            ()),

        // what to do on each frame tick
        update : (function () {

            var offset = 0,
            rate = Math.PI / 180;

            return function () {

                this.fix.tick();

                setByExp.call(pubState);

                // workers
                if (pubState.workers.current.length < pubState.workers.max) {

                    pubState.workers.current.push(new Worker());

                }

                pubState.workers.current.forEach(function (worker) {

                    var i,
                    fix;

                    worker.update();

                    i = worker.fixArray.length;
                    while (i--) {

                        fix = worker.fixArray[i];

                        fix.update();

                        if (fix.progress === 1) {

                            pubAPI.deglitch(1);

                            worker.fixArray.splice(i, 1)

                        }

                    }

                });

                if (pubState.glitch === 0) {

                    onWin.call(pubState);

                }

                setBX(offset);

                offset += rate;

                if (offset >= Math.PI * 2) {

                    offset -= Math.PI * 2;

                }

            };

        }
            ())

    };

    // setup buttons
    pubState.buttons.push(new Shell.Button('fix', '', 20, 400, 64, 64));
    pubState.buttons.push(new Shell.Button('wave', pubState, 20, 20, 200, 20));
    pubState.buttons.push(new Shell.Button('level', pubState, 20, 40, 200, 20));
    pubState.buttons.push(new Shell.Button('glitch', pubState, 20, 60, 200, 20));

    // bx buttons are for the little animation that reperesents the game working they way it should.
    var i = 6;
    while (i--) {

        pubState.buttons.push(new Shell.Button('bx' + i, '', 0, 0, 32, 32));

    }

    setBX(0);

    // defaut to wave 1
    setWave.call(pubState, 1);

    // return the public API to the game global variable
    return pubAPI;

}
    ());
