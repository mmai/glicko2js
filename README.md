# Glicko 2 javascript implementation

The Glicko-2 rating system is a method for assessing a player's strength in games of skill, such as chess and go.
The algorithm is explained by its author, Mark E. Glickman, on http://glicko.net/glicko.html.

Each player begins with a rating, a rating deviation (accuracy of the rating) and a volatility (speed of rating evolution). These values will evolve according to the outcomes of matches with other players.

## Usage

First we initiate a ranking manager and create players with initial ratings, rating deviations and volatilities.

``` javascript
var glicko2 = require('glicko2');
var settings = {
  tau : 0.5, // "Reasonable choices are between 0.3 and 1.2, though the system should be tested to decide which value results in greatest predictive accuracy."
  rating : 1500, //default rating
  rd : 200, //Default rating deviation (small number = good confidence on the rating accuracy)
  vol : 0.06 //Default volatility (expected fluctation on the player rating)
};
var ranking = new glicko2.Glicko2(settings);

// Create players
var Ryan = ranking.makePlayer();
var Bob = ranking.makePlayer(1400, 30, 0.06);
var John = ranking.makePlayer(1550, 100, 0.06);
var Mary = ranking.makePlayer(1700, 300, 0.06);
```

We can then enter results, calculate the new ratings

``` javascript
var matches = [];
matches.push([Ryan, Bob, 1]); //Ryan won over Bob
matches.push([Ryan, John, 0]); //Ryan lost against John
matches.push([Ryan, Mary, 0.5]); //A draw between Ryan and Mary
ranking.updateRatings(matches);
```

... and get these new ratings.

``` javascript
console.log("Ryan new rating: " + Ryan.getRating());
console.log("Ryan new rating deviation: " + Ryan.getRd());
console.log("Ryan new volatility: " + Ryan.getVol());
```

Or you can add matches and players at the same time :

``` javascript
var ryan = {rating:1500, rd:200, vol:0.06, id:'ryan'};
var bob = {rating:1400, rd:30, vol:0.06, id:'bob'};
var john = {rating:1550, rd:100, vol:0.06, id:'john'};
var mary = {rating:1700, rd:300, vol:0.06, id:'mary'};

var match = ranking.addMatch(ryan, bob, 1);
Ryan = match.pl1;
ranking.addMatch(ryan, john, 0);
ranking.addMatch(ryan, mary, 0);

ranking.updateRatings();

console.log("Ryan new rating: " + Ryan.getRating());
```

Get players list

``` javascript
var players = ranking.getPlayers();
```

## Installation

glicko2.js is available as a npm module.

Install globally with:

``` shell
$ npm install -g glicko2
```
