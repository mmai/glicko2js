# Glicko 2 javascript implementation

[![Build Status](https://travis-ci.org/mmai/glicko2js.png)](https://travis-ci.org/mmai/glicko2js)


The Glicko-2 rating system is a method for assessing a player's strength in games of skill, such as chess and go.
The algorithm is explained by its author, Mark E. Glickman, on http://glicko.net/glicko.html.

Each player begins with a rating, a rating deviation (accuracy of the rating) and a volatility (speed of rating evolution). These values will evolve according to the outcomes of matches with other players.

## Installation

### As a node.js module

glicko2.js is available as a [npm module](https://www.npmjs.com/package/glicko2).

Install with npm:

``` shell
npm install glicko2
```

or with yarn:

``` shell
yarn add glicko2
```

### In the browser

You just need to include the glicko2.js script.
See index.html in the example folder.

``` html
<script src="glicko2.js"></script>
```

### With [bower](http://bower.io/)

``` shell
bower install glicko2
```
``` html
<script src="bower_components/glicko2/glicko2.js"></script>
```

## Usage

In node.js, just require the module :

``` javascript
import { Glicko2 } from 'glicko2';
```

or

``` javascript
const { Glicko2 } = require('glicko2');
```

First we initiate a ranking manager and create players with initial ratings, rating deviations and volatilities.

``` javascript
const ranking = new Glicko2({
  // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
  //      be tested to decide which value results in greatest predictive accuracy."
  // If not set, default value is 0.5
  tau: 0.5,

  // rating : default rating
  // If not set, default value is 1500
  rating: 1500,

  // rd : Default rating deviation
  //     small number = good confidence on the rating accuracy
  // If not set, default value is 350
  rd: 200,

  // vol : Default volatility (expected fluctation on the player rating)
  // If not set, default value is 0.06
  vol: 0.06,
});

// Create players
const Ryan = ranking.makePlayer();
const Bob = ranking.makePlayer(1400, 30, 0.06);
const John = ranking.makePlayer(1550, 100, 0.06);
const Mary = ranking.makePlayer(1700, 300, 0.06);
```

We can then enter results, calculate the new ratings...

``` javascript
const matches = [];

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
const players = ranking.getPlayers();
```

Predict outcome

``` javascript
const expected = ranking.predict(Ryan, Bob); // or Ryan.predict(Bob);
console.log("Ryan has " + (expected * 100) + "% chances of winning against Bob in the next match");
```

## When to update rankings

You should not update the ranking after each match.
The typical use of glicko is to calculate the ratings after each tournament (ie collection of matches in a period of time).
A player rating will evolve after a tournament has finished, but not during the tournament.

Here is what says Mark E. Glickman about the number of matches in a tournament or rating period (cf. <http://www.glicko.net/glicko/glicko2.pdf>) :
> The Glicko-2 system works best when the number of games in a rating period is moderate to large, say an average of at least 10-15 games per player in a rating period.

## How to deal with a big database of players

If you don't want to load all the players and new matches at once in memory in order to update rankings, here is a strategy you can follow:

Say you want to update rankings each week, and you have a history of the rankings data (rating, rating deviation, volatility) for each player.

At the end of the week, for **each** player (even those that did not play):
  - load from the database:
    - the player ranking data for the current week
    - the matches the player has played during the week
    - for each match, the player's opponent data for the current week
  - add the player and his opponents to a new glicko instance
  - add the matches to the glicko instance
  - update glicko rankings
  - save the player updated ranking data to database as the next week player data

It is important to update rankings even for players that did not play : this is the way the system can increase their rating deviation over time.

At the last step, don't overwrite the player current week data, as it will be loaded when calculating its opponents new rankings.

### Support for multiple competitors matches (experimental)

**Note: the glicko2 algorithm was not designed for multiple competitors matches, this is a naive workaround whose results should be taken whith caution.**

You can enter results from games where multiple competitors play against each other at the same time (ie swimming, racing...).

First make "Race" objects by entering the results in an array of "positions", where each position is an array of players at this position :

```javascript
const race1 = glicko.makeRace(
    [
        [Ryan], //Ryan won the race
        [Bob, John], //Bob and John ended ex aequo at the 2nd position
        [Mary] // Mary 4th position
    ]
);

const race2 = glicko.makeRace(
    [
        [Mary], // won
        [Bob],  // 2nd
        [John], // 3rd
        [Ryan], // 4th
    ]
);

```

Then convert the races to the equivalent matches :
``` javascript

const matches1 = race1.getMatches();
const matches2 = race2.getMatches();

const allMatches = matches1.concat(matches2)

ranking.updateRatings(allMatches);
```

You can also update ratings for one race without converting to matches :

``` javascript
ranking.updateRatings(race1);
```

## Testing

Run unit tests with:

``` shell
npm run test
```

## License

This library is under [MIT License](LICENSE.md).
