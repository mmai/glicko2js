var gsettings = require('./glicko2_settings');
var glicko2 = require('./glicko2');

var ranking = new glicko2.Ranking(gsettings);

// Create players
var Ryan = ranking.makePlayer();
var Bob = ranking.makePlayer(1400, 30, 0.06);
var John = ranking.makePlayer(1550, 100, 0.06);
var Mary = ranking.makePlayer(1700, 300, 0.06);

// Following the example at:
// http://math.bu.edu/people/mg/glicko/glicko2.doc/example.html
// Pretend Ryan (of rating 1500 and rating deviation 350) plays players of ratings 1400, 1550 and 1700
// and rating deviations 30, 100 and 300 respectively with outcomes 1, 0 and 0.
console.log( "Old Rating: " + Ryan.getRating());
console.log("Old Rating Deviation: " + Ryan.getRd());
console.log("Old Volatility: " + Ryan.vol);

ranking.startPeriod();
ranking.addResult(Ryan, Bob, 1); //Ryan won over Bob
ranking.addResult(Ryan, John, 0); //Ryan lost against John
ranking.addResult(Ryan, Mary, 0); //Ryan lost against Mary
ranking.stopPeriod();

// 1 : victory, 0 : defeat, 0.5 : draw

console.log("New Rating: " + Ryan.getRating());
console.log("New Rating Deviation: " + Ryan.getRd());
console.log("New Volatility: " + Ryan.vol);
