var glicko2 = require('./glicko2');

// Create a player called Ryan
var Ryan = new glicko2.Player();
// Following the example at:
// http://math.bu.edu/people/mg/glicko/glicko2.doc/example.html
// Pretend Ryan (of rating 1500 and rating deviation 350)
// plays players of ratings 1400, 1550 and 1700
// and rating deviations 30, 100 and 300 respectively
// with outcomes 1, 0 and 0.
console.log( "Old Rating: " + Ryan.getRating());
console.log("Old Rating Deviation: " + Ryan.getRd());
console.log("Old Volatility: " + Ryan.vol);

Ryan.update_player([1400, 1550, 1700], [30, 100, 300], [1, 0, 0]);

console.log("New Rating: " + Ryan.getRating());
console.log("New Rating Deviation: " + Ryan.getRd());
console.log("New Volatility: " + Ryan.vol);
