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
  // Convert the rating and rating deviation values for internal use.
  var rating_list = [];
  for (var i=0, len = this.adv_ranks.length;i<len;i++){
    rating_list[i] = (this.adv_ranks[i] - 1500) / 173.7178 ;
  }

  var RD_list = [];
  for (i=0,len = this.adv_rds.length;i<len;i++){
    RD_list[i] = this.adv_rds[i] / 173.7178 ;
  }

  var v = this._v(rating_list, RD_list);
  this.__vol = this._newVol(rating_list, RD_list, this.outcomes, v);
  this._preRatingRD();

  this.__rd = 1 / Math.sqrt((1 / Math.pow(this.__rd, 2)) + (1 / v));

  var tempSum = 0;
  for (i=0,len = rating_list.length;i< len;i++){
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
}

Glicko2.prototype.startPeriod = function(){
  for (var i = 0, len = this.players.length;i < len;i++){
    this.players[i].adv_ranks = [];
    this.players[i].adv_rds = [];
    this.players[i].outcomes = [];
  }
};

Glicko2.prototype.stopPeriod = function(){
  for (var i = 0, len = this.players.length;i < len;i++){
    this.players[i].update_rank();
  }
};

Glicko2.prototype.addResult = function(player1, player2, outcome){
  player1.adv_ranks.push(player2.getRating());
  player1.adv_rds.push(player2.getRd());
  player1.outcomes.push(outcome);

  player2.adv_ranks.push(player1.getRating());
  player2.adv_rds.push(player1.getRd());
  player2.outcomes.push(1 - outcome);
};

Glicko2.prototype.updateRatings = function(matches){
  this.startPeriod();
  for (var i=0, len = matches.length;i<len;i++){
    var match = matches[i];
    this.addResult(match[0], match[1], match[2]);
  }
  this.stopPeriod();
};

Glicko2.prototype.makePlayer = function (rating, rd , vol){
  var player = new Player(rating || this._default_rating, rd || this._default_rd, vol || this._default_vol, this._tau);
  player.adv_ranks = [];
  player.adv_rds = [];
  player.outcomes = [];
  this.players.push(player);
  return player;
};


exports.Glicko2 = Glicko2;
