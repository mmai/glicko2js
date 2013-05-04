(function(exports){

    function Player(rating, rd , vol, tau){
      this.setRating(rating);
      this.setRd(rd);
      this.setVol(vol);
      this._tau = tau; 
    }

    Player.prototype.getRating = function (){
      return Math.round(this.__rating * 173.7178) + this.defaultRating;
    };

    Player.prototype.setRating = function (rating){
      this.__rating = (rating - this.defaultRating) / 173.7178;
    };

    Player.prototype.getRd = function(){
      return Math.round(this.__rd * 173.7178);
    };

    Player.prototype.setRd = function(rd){
      this.__rd = rd / 173.7178;
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
      var rating_list = this.adv_ranks;
      var RD_list = this.adv_rds;

      //Step 1 : done by Player initialization
      //Step 2 : done by setRating and setRd
      //Step 3
      var v = this._variance(rating_list, RD_list);

      //Step 4 & 5
      this.__vol = this._newVol(rating_list, RD_list, this.outcomes, v);

      //Step 6
      this._preRatingRD();

      //Step 7
      this.__rd = 1 / Math.sqrt((1 / Math.pow(this.__rd, 2)) + (1 / v));

      var tempSum = 0;
      for (var i=0,len = rating_list.length;i< len;i++){
        tempSum += this._g(RD_list[i]) * (this.outcomes[i] - this._E(rating_list[i], RD_list[i]));
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
    Player.prototype._variance = function ( rating_list, RD_list){
      var tempSum = 0;
      for (var i = 0, len = rating_list.length;i<len;i++){
        var tempE = this._E(rating_list[i], RD_list[i]);
        tempSum += Math.pow(this._g(RD_list[i]), 2) * tempE * (1 - tempE);
      }
      return 1 / tempSum;
    };

    // The Glicko E function.
    Player.prototype._E = function (p2rating, p2RD){
      return 1 / (1 + Math.exp(-1 * this._g(p2RD) *  (this.__rating - p2rating)));
    };

    // The Glicko2 g(RD) function.
    Player.prototype._g = function( RD){
      return 1 / Math.sqrt(1 + 3 * Math.pow(RD, 2) / Math.pow(Math.PI, 2));
    };
      
    // Calculating the new volatility as per the Glicko2 system.
    Player.prototype._newVol = function( rating_list, RD_list, outcome_list, v){
      //Step 4
      var delta = this._delta(rating_list, RD_list, outcome_list, v);

      //Step 5
      var a = Math.log(Math.pow(this.__vol, 2));
      var f = this._makef(delta, v, a);
      var epsilon = 0.000001;
      var A = a;
      var B, k;

      if (Math.pow(delta, 2) >  Math.pow(this.__rd, 2) + v){
        B = Math.log(Math.pow(delta, 2) -  Math.pow(this.__rd, 2) - v);
      }
      else {
        k = 1;
        while (f(a - k * this._tau) < 0){
          k = k + 1;
        }
        B = a - k * this._tau;
      }

      var fA = f(A);
      var fB = f(B);
      var C, fC;
      while (Math.abs(B - A) > epsilon){
        C = A + (A - B) * fA /(fB - fA );
        fC = f(C);
        if (fC * fB < 0){
          A = B;
          fA = fB;
        }
        else {
          fA = fA / 2;
        }
        B = C;
        fB = fC;
      }
      return Math.exp(A/2);
    };

    // The delta function of the Glicko2 system.
    // Calculation of the estimated improvement in rating (step 4 of the algorithm)
    Player.prototype._delta = function( rating_list, RD_list, outcome_list, v){
      var tempSum = 0;
      for (var i = 0, len = rating_list.length;i<len;i++){
        tempSum += this._g(RD_list[i]) * (outcome_list[i] - this._E(rating_list[i], RD_list[i]));
      }
      return v * tempSum;
    };

    Player.prototype._makef = function(delta, v, a){
      var pl = this;
      return function(x){
        return Math.exp(x) * (Math.pow(delta, 2) - Math.pow(pl.__rd, 2) - v - Math.exp(x)) / (2*Math.pow(Math.pow(pl.__rd, 2) + v + Math.exp(x), 2)) - (x - a) / Math.pow(pl._tau, 2);
      };
    };

    function Glicko2(settings){
      settings = settings || {
        tau : 0.5, // Internal glicko2 parameter. "Reasonable choices are between 0.3 and 1.2, though the system should be tested to decide which value results in greatest predictive accuracy."
        rating : 1500, //default rating
        rd : 350, //Default rating deviation (small number = good confidence on the rating accuracy)
        vol : 0.06 //Default volatility (expected fluctation on the player rating)
      };
      Player.prototype.defaultRating = settings.rating;

      this._tau = settings.tau;
      this._default_rating = settings.rating;
      this._default_rd = settings.rd;
      this._default_vol = settings.vol;
      this.players = [];
      this.players_index = 0;
    }

    Glicko2.prototype.removePlayers = function() {
      this.players = [];
      this.players_index = 0;
    };

    Glicko2.prototype.getPlayers = function(){
      var that = this;
      var players = [];
      var player;
      Object.keys(that.players).forEach(function(key){
          player = that.players[key];
          player.id = key.slice(1);
          players.push(player);
        });
      return players;
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
      var pl1 = this.makePlayer(player1.rating, player1.rd, player1.vol, player1.id);
      var pl2 = this.makePlayer(player2.rating, player2.rd, player2.vol, player2.id);
      this.addResult(pl1, pl2, outcome);
      return {pl1:pl1, pl2:pl2};
    };

    Glicko2.prototype.makePlayer = function (rating, rd , vol, id){
      if (id === undefined){
        id = "a" + this.players_index;
        this.players_index = this.players_index + 1;
      }
      else {
        id = "b" + id;
        //We check if the player has already been created
        var candidate = this.players[id];
        if (candidate !== undefined){
          return candidate;
        }
      }

      var player = new Player(rating || this._default_rating, rd || this._default_rd, vol || this._default_vol, this._tau);
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
      if (typeof(matches) !== 'undefined'){
        this.cleanPreviousMatches();
        for (var i=0, len = matches.length;i<len;i++){
          var match = matches[i];
          this.addResult(match[0], match[1], match[2]);
        }
      }
      this.calculatePlayersRatings();
    };

    exports.Glicko2 = Glicko2;

})(typeof exports === 'undefined'? this['glicko2']={}: exports);
