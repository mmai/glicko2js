# Glicko 2 javascript implementation

[![Build Status](https://travis-ci.org/mmai/glicko2js.png)](https://travis-ci.org/mmai/glicko2js)
[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=rhumbs&url=https://github.com/mmai/glicko2js&title=glicko2js&language=&tags=github&category=software)


The Glicko-2 rating system is a method for assessing a player's strength in games of skill, such as chess and go.
The algorithm is explained by its author, Mark E. Glickman, on http://glicko.net/glicko.html.

Each player begins with a rating, a rating deviation (accuracy of the rating) and a volatility (speed of rating evolution). These values will evolve according to the outcomes of matches with other players.

## Usage

First we initiate a ranking manager and create players with initial ratings, rating deviations and volatilities.

``` javascript
var glicko2 = require('glicko2');
var settings = {
  // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
  //       be tested to decide which value results in greatest predictive accuracy."
  tau : 0.5,
  // rating : default rating
  rating : 1500,
  //rd : Default rating deviation
  //     small number = good confidence on the rating accuracy
  rd : 200,
  //vol : Default volatility (expected fluctation on the player rating)
  vol : 0.06
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

### Support for multiple competitors matches

You can easily enter results from games where multiple competitors play against each other at the same time (ie swimming, racing...).

First make "Race" objects by entering the results in an array of "positions", where each position is an array of players at this position :

```javascript
var race1 = glicko.makeRace(
    [
        [Ryan], //Ryan won the race
        [Bob, John], //Bob and John ended ex aequo at the 2nd position
        [Mary] // Mary 4th position
    ]
);

var race2 = glicko.makeRace(
    [
        [Mary], // won
        [Bob],  // 2nd
        [John], // 3rd
        [Ryan], // 4th
    ]
);

```

Then convert the races to the equivalent matches :
```javascript

var matches1 = race1.getMatches();
var matches2 = race2.getMatches();

var allMatches = matches1.concat(matches2)

ranking.updateRatings(allMatches);
```

You can also update ratings for one race without converting to matches :

```javascript
ranking.updateRatings(race1);
```

## When to update rankings

You should not update the ranking after each match.
The typical use of glicko is to calculate the ratings after each tournament (ie collection of matches in a period of time).
A player rating will evolve after a tournament has finished, but not during the tournament. 

You can see a client side javascript example using tournaments here : https://github.com/mmai/glicko2js/blob/master/example/index.html

Here is what says Mark E. Glickman about the number of matches in a tournament or rating period (cf. http://www.glicko.net/glicko/glicko2.pdf ) :
> The Glicko-2 system works best when the number of games in a rating period is moderate to large, say an average of at least 10-15 games per player in a rating period.
