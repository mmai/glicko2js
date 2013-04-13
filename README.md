# Glicko 2 javascript implementation

The Glicko-2 rating system is a method for assessing a player's strength in games of skill, such as chess and go.
The algorithm is explained by its author, Mark E. Glickman, on http://glicko.net/glicko.html.

Each player begins with a rating, a rating deviation (accuracy of the rating) and a volatility (speed of rating evolution). These values will evolve according to the outcomes of matches with other players.

## Usage

In the browser, you need to include the glicko2.js file :

``` html
<script src="glicko2.js"></script>
```

In node.js, just require the module :

``` javascript
var glicko2 = require('glicko2');
```

First we initiate a ranking manager and create players with initial ratings, rating deviations and volatilities.

``` javascript
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

We can then enter results, calculate the new ratings...

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

Get players list

``` javascript
var players = ranking.getPlayers();
```

## When to update rankings

You should not update the ranking after each match.
The typical use of glicko is to calculate the ratings after each tournament (ie collection of matches in a period of time).
A player rating will evolve after a tournament has finished, but not during the tournament. 

Here is what says Mark E. Glickman about the number of matches in a tournament or rating period (cf. http://www.glicko.net/glicko/glicko2.pdf ) :
> The Glicko-2 system works best when the number of games in a rating period is moderate to large, say an average of at least 10-15 games per player in a rating period.

## Installation

### In the browser

You just need to include the glicko2.js script.
See index.html in the example folder.

``` html
<script src="glicko2.js"></script>
```

### As a node.js module

glicko2.js is available as a npm module.

Install globally with:

``` shell
$ npm install -g glicko2
```

## They use Glicko2js

* [Nodewar](http://www.nodewar.com), a programming game for the browser
