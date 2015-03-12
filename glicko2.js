(function(exports){
    var scalingFactor = 173.7178;

    function Race(results){
        this.matches = this.computeMatches(results);
    }
    Race.prototype.getMatches = function(){
        return this.matches;
    };
    Race.prototype.computeMatches = function(results){
        var players = [];
        var position = 0;

        results.forEach(function (rank) {
            position += 1;
            rank.forEach(function (player) {
                players.push({"player": player, "position": position});
            })
        })

        function computeMatches(players){
            if (players.length === 0) return [];

            var player1 = players.shift()
            var player1_results  = players.map(function(player2){
                return [player1.player, player2.player, (player1.position < player2.position) ? 1 : 0.5];
            });

            return player1_results.concat(computeMatches(players));
        }

        return computeMatches(players)
    }

    function Player(rating, rd , vol, tau){
        this._tau = tau; 

        this.setRating(rating);
        this.setRd(rd);
        this.setVol(vol);
    }

    Player.prototype.getRating = function (){
        return this.__rating * scalingFactor + this.defaultRating;
    };

    Player.prototype.setRating = function (rating){
        this.__rating = (rating - this.defaultRating) / scalingFactor;
    };

    Player.prototype.getRd = function(){
        return this.__rd * scalingFactor;
    };

    Player.prototype.setRd = function(rd){
        this.__rd = rd / scalingFactor;
    };

    Player.prototype.getVol = function(){
        return this.__vol;
    };

    Player.prototype.setVol = function(vol){
        this.__vol = vol;
    };

    Player.prototype.addResult = function(opponent, outcome){
        this.adv_ranks.push(opponent.__rating);
        this.adv_rds.push(opponent.__rd);
        this.outcomes.push(outcome);
    };

    // Calculates the new rating and rating deviation of the player.
    // Follows the steps of the algorithm described at http://www.glicko.net/glicko/glicko2.pdf
    Player.prototype.update_rank = function(){
        if (!this.hasPlayed()){
            // Applies only the Step 6 of the algorithm
            this._preRatingRD();
            return;
        }

        //Step 1 : done by Player initialization
        //Step 2 : done by setRating and setRd

        //Step 3
        var v = this._variance();

        //Step 4
        var delta = this._delta(v);

        //Step 5
        this.__vol = this.volatility_algorithm(v, delta);

        //Step 6
        this._preRatingRD();

        //Step 7
        this.__rd = 1 / Math.sqrt((1 / Math.pow(this.__rd, 2)) + (1 / v));

        var tempSum = 0;
        for (var i=0,len = this.adv_ranks.length;i< len;i++){
            tempSum += this._g(this.adv_rds[i]) * (this.outcomes[i] - this._E(this.adv_ranks[i], this.adv_rds[i]));
        }
        this.__rating += Math.pow(this.__rd, 2) * tempSum;

        //Step 8 : done by getRating and getRd
    };

    Player.prototype.hasPlayed = function(){
        return this.outcomes.length > 0;
    };

    // Calculates and updates the player's rating deviation for the beginning of a rating period.
    // preRatingRD() -> None
    Player.prototype._preRatingRD = function(){
        this.__rd = Math.sqrt(Math.pow(this.__rd, 2) + Math.pow(this.__vol, 2));
    };


    // Calculation of the estimated variance of the player's rating based on game outcomes
    Player.prototype._variance = function (){
        var tempSum = 0;
        for (var i = 0, len = this.adv_ranks.length;i<len;i++){
            var tempE = this._E(this.adv_ranks[i], this.adv_rds[i]);
            tempSum += Math.pow(this._g(this.adv_rds[i]), 2) * tempE * (1 - tempE);
        }
        return 1 / tempSum;
    };

    // The Glicko E function.
    Player.prototype._E = function (p2rating, p2RD){
        return 1 / (1 + Math.exp(-1 * this._g(p2RD) *  (this.__rating - p2rating)));
    };

    // The Glicko2 g(RD) function.
    Player.prototype._g = function(RD){
        return 1 / Math.sqrt(1 + 3 * Math.pow(RD, 2) / Math.pow(Math.PI, 2));
    };

    // The delta function of the Glicko2 system.
    // Calculation of the estimated improvement in rating (step 4 of the algorithm)
    Player.prototype._delta = function(v){
        var tempSum = 0;
        for (var i = 0, len = this.adv_ranks.length;i<len;i++){
            tempSum += this._g(this.adv_rds[i]) * (this.outcomes[i] - this._E(this.adv_ranks[i], this.adv_rds[i]));
        }
        return v * tempSum;
    };

    Player.prototype._makef = function(delta, v, a){
        var pl = this;
        return function(x){
            return Math.exp(x) * (Math.pow(delta, 2) - Math.pow(pl.__rd, 2) - v - Math.exp(x)) / (2*Math.pow(Math.pow(pl.__rd, 2) + v + Math.exp(x), 2)) - (x - a) / Math.pow(pl._tau, 2);
        };
    };

    //=========================  Glicko2 class =============================================
    function Glicko2(settings){
        settings = settings || {};

        // Internal glicko2 parameter. "Reasonable choices are between 0.3 and
        // 1.2, though the system should be tested to decide which value results
        // in greatest predictive accuracy."
        this._tau = settings.tau || 0.5;

        // Default rating
        this._default_rating = settings.rating || 1500;

        // Default rating deviation (small number = good confidence on the
        // rating accuracy)
        this._default_rd = settings.rd || 350;

        // Default volatility (expected fluctation on the player rating)
        this._default_vol = settings.vol || 0.06;

        // Default volatility calculation algorithm (step 5 of the global
        // algorithm)
        this._volatility_algorithm = volatility_algorithms[settings.volatility_algorithm || 'newprocedure'];

        this.players = [];
        this.players_index = 0;
    }

    Glicko2.prototype.makeRace = function(results){
        return new Race(results);
    };

    Glicko2.prototype.removePlayers = function() {
        this.players = [];
        this.players_index = 0;
    };

    Glicko2.prototype.getPlayers = function(){
        return this.players;
    };

    Glicko2.prototype.cleanPreviousMatches = function(){
        for (var i = 0, len = this.players.length;i < len;i++){
            this.players[i].adv_ranks = [];
            this.players[i].adv_rds = [];
            this.players[i].outcomes = [];
        }
    };

    Glicko2.prototype.calculatePlayersRatings = function(){
        var keys = Object.keys(this.players);
        for (var i=0, len = keys.length;i<len;i++){
            this.players[keys[i]].update_rank();
        }
    };

    /** 
     * Add players and match result to be taken in account for the new rankings calculation
     * players must have ids, they are not created if it has been done already.
     * @param {Object litteral} pl1 The first player
     * @param {Object litteral} pl2 The second player
     * @param {number} outcom The outcome : 0 = defeat, 1 = victory, 0.5 = draw
     */
      Glicko2.prototype.addMatch = function(player1, player2, outcome){
          var pl1 = this._createInternalPlayer(player1.rating, player1.rd, player1.vol, player1.id);
          var pl2 = this._createInternalPlayer(player2.rating, player2.rd, player2.vol, player2.id);
          this.addResult(pl1, pl2, outcome);
          return {pl1:pl1, pl2:pl2};
      };

      Glicko2.prototype.makePlayer = function (rating, rd , vol) {
          //We do not expose directly createInternalPlayer in order to prevent the assignation of a custom player id whose uniqueness could not be guaranteed
          return this._createInternalPlayer(rating, rd, vol);
      };

      Glicko2.prototype._createInternalPlayer = function (rating, rd , vol, id){
          if (id === undefined){
              id = this.players_index;
              this.players_index = this.players_index + 1;
          } else {
              //We check if the player has already been created
              var candidate = this.players[id];
              if (candidate !== undefined){
                  return candidate;
              }
          }
          var player = new Player(rating || this._default_rating, rd || this._default_rd, vol || this._default_vol, this._tau);
          var playerProto = Object.getPrototypeOf(player);

          // Set this specific Player's `defaultRating`. This _has_ to be done
          // here in order to ensure that new `Glicko2` instances do not change
          // the `defaultRating` of `Player` instances created under previous
          // `Glicko2` instances.
          playerProto.defaultRating = this._default_rating;

          // Same reasoning and purpose as the above code regarding
          // `defaultRating`
          playerProto.volatility_algorithm = this._volatility_algorithm;

          // Since this `Player`'s rating was calculated upon instantiation,
          // before the `defaultRating` was defined above, we much re-calculate
          // the rating manually.
          player.setRating(rating || this._default_rating);

          player.id = id;
          player.adv_ranks = [];
          player.adv_rds = [];
          player.outcomes = [];
          this.players[id] = player;
          return player;
      };

      /** 
       * Add a match result to be taken in account for the new rankings calculation
       * @param {Player} player1 The first player
       * @param {Player} player2 The second player
       * @param {number} outcome The outcome : 0 = defeat, 1 = victory, 0.5 = draw
       */
        Glicko2.prototype.addResult = function(player1, player2, outcome){
            player1.addResult(player2, outcome);
            player2.addResult(player1, 1 - outcome);
        };

        Glicko2.prototype.updateRatings = function(matches){
            if(matches instanceof Race){
                matches = matches.getMatches();
            }
            if (typeof(matches) !== 'undetypeof(matches)fined'){
                this.cleanPreviousMatches();
                for (var i=0, len = matches.length;i<len;i++){
                    var match = matches[i];
                    this.addResult(match[0], match[1], match[2]);
                }
            }
            this.calculatePlayersRatings();
        };

        //============== VOLATILITY ALGORITHMS (Step 5 of the global glicko2 algorithm)
        var volatility_algorithms = {
            oldprocedure: function(v, delta) {
                var sigma = this.__vol;
                var phi = this.__rd;
                var tau = this._tau;

                var a, x1, x2, x3, y1, y2, y3, upper;
                var result;

                upper = find_upper_falsep(phi, v, delta, tau);

                a = Math.log(Math.pow(sigma, 2));
                y1 = equation(phi, v, 0, a, tau, delta);
                if (y1 > 0 ){
                    result = upper;
                } else {
                    x1 = 0;
                    x2 = x1;
                    y2 = y1;
                    x1 = x1 - 1;
                    y1 = equation(phi, v, x1, a, tau, delta);
                    while (y1 < 0){
                        x2 = x1;
                        y2 = y1;
                        x1 = x1 - 1;
                        y1 = equation(phi, v, x1, a, tau, delta);
                    }
                    for (var i = 0; i<21; i++){
                        x3 = y1 * (x1 - x2) / (y2 - y1) + x1;
                        y3 = equation(phi, v, x3, a, tau, delta);
                        if (y3 > 0 ){
                            x1 = x3;
                            y1 = y3;
                        } else {
                            x2 = x3;
                            y2 = y3;
                        }
                    }
                    if (Math.exp((y1 * (x1 - x2) / (y2 - y1) + x1) / 2) > upper ){
                        result = upper;
                    } else {
                        result = Math.exp((y1 * (x1 - x2) / (y2 - y1) + x1) / 2);
                    }
                }
                return result;

                //
                function new_sigma(sigma , phi , v , delta , tau ) {
                    var a = Math.Math.log(Math.pow(sigma, 2));
                    var x = a;
                    var old_x = 0;
                    while (x != old_x){
                        old_x = x;
                        var d = Math.pow(phi, 2) + v + Math.exp(old_x);
                        var h1 = -(old_x - a) / Math.pow(tau, 2) - 0.5 * Math.exp(old_x) / d + 0.5 * Math.exp(old_x) * Math.pow((delta / d), 2);
                        var h2 = -1 / Math.pow(tau, 2) - 0.5 * Math.exp(old_x) * (Math.pow(phi, 2) + v) / Math.pow(d, 2) + 0.5 * Math.pow(delta, 2) * Math.exp(old_x) * (Math.pow(phi, 2) + v - Math.exp(old_x)) / Math.pow(d, 3);
                        x = old_x - h1 / h2;
                    }
                    return  Math.exp(x / 2);
                }

                function equation(phi , v , x , a , tau , delta) {
                    var d = Math.pow(phi, 2) + v + Math.exp(x);
                    return -(x - a) / Math.pow(tau, 2) - 0.5 * Math.exp(x) / d + 0.5 * Math.exp(x) * Math.pow((delta / d), 2);
                }

                function new_sigma_bisection(sigma , phi , v , delta , tau ) {
                    var a, x1, x2, x3;
                    a = Math.Math.log(Math.pow(sigma, 2));
                    if (equation(phi, v, 0, a, tau, delta) < 0 ){
                        x1 = -1;
                        while (equation(phi, v, x1, a, tau, delta) < 0){
                            x1 = x1 - 1;
                        }
                        x2 = x1 + 1;
                    } else {
                        x2 = 1;
                        while (equation(phi, v, x2, a, tau, delta) > 0){
                            x2 = x2 + 1;
                        }
                        x1 = x2 - 1;
                    }

                    for (var i = 0; i < 27; i++) {
                        x3 = (x1 + x2) / 2;
                        if (equation(phi, v, x3, a, tau, delta) > 0 ){
                            x1 = x3;
                        } else {
                            x2 = x3;
                        }
                    }
                    return  Math.exp((x1 + x2)/ 4);
                }

                function Dequation(phi , v , x , tau , delta) {
                    d = Math.pow(phi, 2) + v + Math.exp(x);
                    return -1 / Math.pow(tau, 2) - 0.5 * Math.exp(x) / d + 0.5 * Math.exp(x) * (Math.exp(x) + Math.pow(delta, 2)) / Math.pow(d, 2) - Math.pow(Math.exp(x), 2) * Math.pow(delta, 2) / Math.pow(d, 3);
                }

                function find_upper_falsep(phi , v , delta , tau) {
                    var x1, x2, x3, y1, y2, y3;
                    y1 = Dequation(phi, v, 0, tau, delta);
                    if (y1 < 0 ){
                        return 1;
                    } else {
                        x1 = 0;
                        x2 = x1;
                        y2 = y1;
                        x1 = x1 - 1;
                        y1 = Dequation(phi, v, x1, tau, delta);
                        while (y1 > 0){
                            x2 = x1;
                            y2 = y1;
                            x1 = x1 - 1;
                            y1 = Dequation(phi, v, x1, tau, delta);
                        }
                        for (var i = 0; i < 21 ; i++){
                            x3 = y1 * (x1 - x2) / (y2 - y1) + x1;
                            y3 = Dequation(phi, v, x3, tau, delta);
                            if (y3 > 0 ){
                                x1 = x3;
                                y1 = y3;
                            } else {
                                x2 = x3;
                                y2 = y3;
                            }
                        }
                        return Math.exp((y1 * (x1 - x2) / (y2 - y1) + x1) / 2);
                    }
                }
            },
            newprocedure: function(v, delta){
                //Step 5.1
                var A = Math.log(Math.pow(this.__vol, 2));
                var f = this._makef(delta, v, A);
                var epsilon = 0.0000001;

                //Step 5.2
                var B, k;
                if (Math.pow(delta, 2) >  Math.pow(this.__rd, 2) + v){
                    B = Math.log(Math.pow(delta, 2) -  Math.pow(this.__rd, 2) - v);
                } else {
                    k = 1;
                    while (f(A - k * this._tau) < 0){
                        k = k + 1;
                    }
                    B = A - k * this._tau;
                }

                //Step 5.3
                var fA = f(A);
                var fB = f(B);

                //Step 5.4
                var C, fC;
                while (Math.abs(B - A) > epsilon){
                    C = A + (A - B) * fA /(fB - fA );
                    fC = f(C);
                    if (fC * fB < 0){
                        A = B;
                        fA = fB;
                    } else {
                        fA = fA / 2;
                    }
                    B = C;
                    fB = fC;
                }
                //Step 5.5
                return Math.exp(A/2);
            },
            newprocedure_mod: function(v, delta){
                //Step 5.1
                var A = Math.log(Math.pow(this.__vol, 2));
                var f = this._makef(delta, v, A);
                var epsilon = 0.0000001;

                //Step 5.2
                var B, k;
                //XXX mod
                if (delta >  Math.pow(this.__rd, 2) + v){
                    //XXX mod
                    B = Math.log(delta -  Math.pow(this.__rd, 2) - v);
                } else {
                    k = 1;
                    while (f(A - k * this._tau) < 0){
                        k = k + 1;
                    }
                    B = A - k * this._tau;
                }

                //Step 5.3
                var fA = f(A);
                var fB = f(B);

                //Step 5.4
                var C, fC;
                while (Math.abs(B - A) > epsilon){
                    C = A + (A - B) * fA /(fB - fA );
                    fC = f(C);
                    if (fC * fB < 0){
                        A = B;
                        fA = fB;
                    } else {
                        fA = fA / 2;
                    }
                    B = C;
                    fB = fC;
                }
                //Step 5.5
                return Math.exp(A/2);
            },
            oldprocedure_simple: function(v, delta){
                var i = 0;
                var a = Math.log(Math.pow(this.__vol, 2));
                var tau = this._tau;
                var x0 = a;
                var x1 = 0;
                var d,h1,h2;

                while (Math.abs(x0 - x1) > 0.00000001){
                    // New iteration, so x(i) becomes x(i-1)
                    x0 = x1;
                    d = Math.pow(this.__rating, 2) + v + Math.exp(x0);
                    h1 = -(x0 - a) / Math.pow(tau, 2) - 0.5 * Math.exp(x0) / d + 0.5 * Math.exp(x0) * Math.pow(delta / d, 2);
                    h2 = -1 / Math.pow(tau, 2) - 0.5 * Math.exp(x0) * (Math.pow(this.__rating, 2) + v) / Math.pow(d, 2) + 0.5 * Math.pow(delta, 2) * Math.exp(x0) * (Math.pow(this.__rating, 2) + v - Math.exp(x0)) / Math.pow(d, 3);
                    x1 = x0 - (h1 / h2);
                }

                return Math.exp(x1 / 2);
            }
        };
        //==== End of volatility algorithms

        exports.Glicko2 = Glicko2;

    })(typeof exports === 'undefined'? this['glicko2']={}: exports);
