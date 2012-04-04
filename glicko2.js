function Player(rating, rd , vol, tau){
  this.setRating(rating);
  this.setRd(rd);
  this.setVol(vol);
  this._tau = tau; 
}

Player.prototype.getRating = function (){
  return (this.__rating * 173.7178) + 1500;
};

Player.prototype.setRating = function (rating){
  this.__rating = (rating - 1500) / 173.7178;
};

Player.prototype.getRd = function(){
  return this.__rd * 173.7178;
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

           
// Calculates and updates the player's rating deviation for the beginning of a rating period.
// preRatingRD() -> None
Player.prototype._preRatingRD = function(){
  this.__rd = Math.sqrt(Math.pow(this.__rd, 2) + Math.pow(this.__vol, 2));
};
        
// Calculates the new rating and rating deviation of the player.
// update_rank() -> None
Player.prototype.update_rank = function(){
  var rating_list = this.adv_ranks;
  var RD_list = this.adv_rds;

  var v = this._v(rating_list, RD_list);
  this.__vol = this._newVol(rating_list, RD_list, this.outcomes, v);
  this._preRatingRD();

  this.__rd = 1 / Math.sqrt((1 / Math.pow(this.__rd, 2)) + (1 / v));

  var tempSum = 0;
  for (var i=0,len = rating_list.length;i< len;i++){
    tempSum += this._g(RD_list[i]) * (this.outcomes[i] - this._E(rating_list[i], RD_list[i]));
  }
  this.__rating += Math.pow(this.__rd, 2) * tempSum;
};
        
        
// Calculating the new volatility as per the Glicko2 system.
// _newVol(list, list, list) -> float
Player.prototype._newVol = function( rating_list, RD_list, outcome_list, v){
  var i = 0;
  var delta = this._delta(rating_list, RD_list, outcome_list, v);
  var a = Math.log(Math.pow(this.__vol, 2));
  var tau = this._tau;
  var x0 = a;
  var x1 = 0;
  var d,h1,h2;

  while (x0 != x1){
    // New iteration, so x(i) becomes x(i-1)
    x0 = x1;
    d = Math.pow(this.__rating, 2) + v + Math.exp(x0);
    h1 = -(x0 - a) / Math.pow(tau, 2) - 0.5 * Math.exp(x0) / d + 0.5 * Math.exp(x0) * Math.pow(delta / d, 2);
    h2 = -1 / Math.pow(tau, 2) - 0.5 * Math.exp(x0) * (Math.pow(this.__rating, 2) + v) / Math.pow(d, 2) + 0.5 * Math.pow(delta, 2) * Math.exp(x0) * (Math.pow(this.__rating, 2) + v - Math.exp(x0)) / Math.pow(d, 3);
    x1 = x0 - (h1 / h2);
  }

  return Math.exp(x1 / 2);
};

// The delta function of the Glicko2 system.
// _delta(list, list, list) -> float
Player.prototype._delta = function( rating_list, RD_list, outcome_list, v){
  var tempSum = 0;
  for (var i = 0, len = rating_list.length;i<len;i++){
    tempSum += this._g(RD_list[i]) * (outcome_list[i] - this._E(rating_list[i], RD_list[i]));
  }
  return v * tempSum;
};

// The v function of the Glicko2 system.
// _v(list[int], list[int]) -> float
Player.prototype._v = function ( rating_list, RD_list){
  var tempSum = 0;
  for (var i = 0, len = rating_list.length;i<len;i++){
    var tempE = this._E(rating_list[i], RD_list[i]);
    tempSum += Math.pow(this._g(RD_list[i]), 2) * tempE * (1 - tempE);
  }
  return 1 / tempSum;
};

// The Glicko E function.
// _E(int) -> float
Player.prototype._E = function (p2rating, p2RD){
  return 1 / (1 + Math.exp(-1 * this._g(p2RD) *  (this.__rating - p2rating)));
};

// The Glicko2 g(RD) function.
// _g() -> float
Player.prototype._g = function( RD){
  return 1 / Math.sqrt(1 + 3 * Math.pow(RD, 2) / Math.pow(Math.PI, 2));
};

// Applies Step 6 of the algorithm. Use this for players who did not compete in the rating period.
// did_not_compete() -> None
Player.prototype.did_not_compete = function(){
  this._preRatingRD();
};

function Glicko2(settings){
  settings = settings || {
    tau : 0.5, // Internal glicko2 parameter. "Reasonable choices are between 0.3 and 1.2, though the system should be tested to decide which value results in greatest predictive accuracy."
    rating : 1500, //default rating
    rd : 200, //Default rating deviation (small number = good confidence on the rating accuracy)
    vol : 0.06 //Default volatility (expected fluctation on the player rating)
  };

  this._tau = settings.tau;
  this._default_rating = settings.rating;
  this._default_rd = settings.rd;
  this._default_vol = settings.vol;
  this.players = [];
  this.players_index = 0;
}

Glicko2.prototype.startPeriod = function(){
  for (var i = 0, len = this.players.length;i < len;i++){
    this.players[i].adv_ranks = [];
    this.players[i].adv_rds = [];
    this.players[i].outcomes = [];
  }
};

Glicko2.prototype.stopPeriod = function(){
  var keys = Object.keys(this.players);
  for (var i=0, len = keys.length;i<len;i++){
    this.players[keys[i]].update_rank();
  }
};

/** 
 * Add a match result to be taken in account for the new rankings calculation
 * @param {Player} player1 The first player
 * @param {Player} player2 The second player
 * @param {number} outcom The outcome : 0 = defeat, 1 = victory, 0.5 = draw
 */
Glicko2.prototype.addResult = function(player1, player2, outcome){
  player1.adv_ranks.push((player2.getRating() - 1500) / 173.7178);
  player1.adv_rds.push(player2.getRd() / 173.7178);
  player1.outcomes.push(outcome);

  player2.adv_ranks.push((player1.getRating() - 1500) / 173.7178);
  player2.adv_rds.push(player1.getRd() / 173.7178);
  player2.outcomes.push(1 - outcome);
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

Glicko2.prototype.updateRatings = function(matches){
  if (typeof(matches) !== 'undefined'){
    this.startPeriod();
    for (var i=0, len = matches.length;i<len;i++){
      var match = matches[i];
      this.addResult(match[0], match[1], match[2]);
    }
  }
  this.stopPeriod();
};

Glicko2.prototype.makePlayer = function (rating, rd , vol, id){
  if (id === undefined){
    id = this.players_index;
    this.players_index = this.players_index + 1;
  }
  else {
    if (typeof(id) === 'number'){
      id = "a" + id;
    }
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


exports.Glicko2 = Glicko2;
