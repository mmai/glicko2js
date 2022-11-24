var glicko2 = require('../glicko2');


// Generate normally distributed random numbers 
// cf. https://mika-s.github.io/javascript/random/normal-distributed/2019/05/15/generating-normally-distributed-random-numbers-in-javascript.html
function boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return { z0, z1 };
}

function getNormallyDistributedRandomNumber(mean, stddev) {
    const { z0, _ } = boxMullerTransform();
    return z0 * stddev + mean;
}

describe('Glicko2', function(){
    describe('makePlayer()', function(){
        it('should make a default player when passed no settings', function(){
            var glicko = new glicko2.Glicko2();
            var player = glicko.makePlayer();
            player.getRating().should.equal(1500);
            player.getRd().should.equal(350);
            player.getVol().should.equal(0.06);
        });
        it('should support setting individual settings', function(){
            var glicko = new glicko2.Glicko2({
              rating: 1600
            });
            var player = glicko.makePlayer();
            player.getRating().should.equal(1600);
            player.getRd().should.equal(350);
            player.getVol().should.equal(0.06);
        });
        it('should not be affected by newer instances of Glicko2', function(){
            var glicko = new glicko2.Glicko2({
              rating: 1400
            });
            var player = glicko.makePlayer();

            var newerGlicko = new glicko2.Glicko2({
              rating: 1600
            });

            player.getRating().should.equal(1400);
        });
    });
    describe('getPlayers()', function(){
        it('should retrieve all players with ids', function(){
        var settings = {
          tau : 0.5,
          rpd : 604800,
          rating : 1500,
          rd : 200,
          vol : 0.06
        };
        var glicko = new glicko2.Glicko2(settings);
        var player = glicko.makePlayer();
        var pl1 = glicko.makePlayer(1400, 30, 0.06);
        var pl3 = glicko.makePlayer(1550, 100, 0.06);
        var players = glicko.getPlayers();
        players.length.should.equal(3);
        players[1].id.should.equal(1);
        players[1].getRating().should.equal(1400);
      });
  });
    describe('updateRatings()', function(){
        it('should calculate new ratings', function(){
                    // Following the example at:
            // http://math.bu.edu/people/mg/glicko/glicko2.doc/example.html
            // Pretend Ryan (of rating 1500 and rating deviation 350) plays players of ratings 1400, 1550 and 1700
            // and rating deviations 30, 100 and 300 respectively with outcomes 1, 0 and 0.
            var settings = {
              tau : 0.5,
              rpd : 604800,
              rating : 1500,
              rd : 200,
              vol : 0.06
            };
            var glicko = new glicko2.Glicko2(settings);
            var Ryan = glicko.makePlayer();
            var Bob = glicko.makePlayer(1400, 30, 0.06);
            var John = glicko.makePlayer(1550, 100, 0.06);
            var Mary = glicko.makePlayer(1700, 300, 0.06);

            var matches = [];
            matches.push([Ryan, Bob, 1]); //Ryan won over Bob
            matches.push([Ryan, John, 0]); //Ryan lost against John
            matches.push([Ryan, Mary, 0]); //Ryan lost against Mary

            /*Perfs testing
            var players = [Bob, John, Mary];

            var ind = 0;
            while (ind++ < 50){
              players.push(glicko.makePlayer());
            }

            var nbpl = players.length;
            var pl1, pl2;
            for (var i=0; i<1000;i++){
              pl1 = players[Math.floor(Math.random() * nbpl)];
              pl2 = players[Math.floor(Math.random() * nbpl)];
              matches.push([pl1, pl2, Math.floor(Math.random() * 3) / 2]);
            }
            //End perfs
            */

            glicko.updateRatings(matches);
            (Math.abs(Ryan.getRating() - 1464.06) < 0.01).should.equal(true);
            (Math.abs(Ryan.getRd() - 151.52) < 0.01).should.equal(true);
            (Math.abs(Ryan.getVol() - 0.05999) < 0.00001).should.equal(true);
          });
        it('should allow to be called multiple times', function(){
          var settings = {
              tau : 0.5,
              rpd : 604800,
              rating : 1500,
              rd : 200,
              vol : 0.06
            };
            var glicko = new glicko2.Glicko2(settings);
            var Ryan = glicko.makePlayer();
            var Bob = glicko.makePlayer(1400, 30, 0.06);
            var John = glicko.makePlayer(1550, 100, 0.06);
            var Mary = glicko.makePlayer(1700, 300, 0.06);

            var matches = [];
            matches.push([Ryan, Bob, 1]); //Ryan won over Bob
            matches.push([Ryan, John, 0]); //Ryan lost against John
            matches.push([Ryan, Mary, 0]); //Ryan lost against Mary
            glicko.updateRatings(matches);

            
            //We initiate a new ranking instance with the actual values of the first one
            var glicko_new = new glicko2.Glicko2(settings);
            var Ryan_new = glicko_new.makePlayer(Ryan.getRating(), Ryan.getRd(), Ryan.getVol());
            var Bob_new = glicko_new.makePlayer(Bob.getRating(), Bob.getRd(), Bob.getVol());
            var John_new = glicko_new.makePlayer(John.getRating(), John.getRd(), John.getVol());
            var Mary_new = glicko_new.makePlayer(Mary.getRating(), Mary.getRd(), Mary.getVol());

            //Second tournament for the first ranking instance
            matches = [];
            matches.push([Ryan, Bob, 0]);
            matches.push([Ryan, John, 1]);
            matches.push([Mary, Bob, 1]);
            glicko.updateRatings(matches);
            //console.log('nb players: ' + glicko.getPlayers().length);

            //Fist tournament for the second ranking instance, with the same matches
            var matches_new = [];
            matches_new.push([Ryan_new, Bob_new, 0]);
            matches_new.push([Ryan_new, John_new, 1]);
            matches_new.push([Mary_new, Bob_new, 1]);
            glicko_new.updateRatings(matches_new);

            //The ratings in both systems should be the same 
            (Math.abs(Ryan.getRating() - Ryan_new.getRating()) < 0.1).should.equal(true);
            (Math.abs(Ryan.getRd() - Ryan_new.getRd()) < 0.1).should.equal(true);
            (Math.abs(Ryan.getVol() - Ryan_new.getVol()) < 0.00001).should.equal(true);
          });
        it('should be able to update ratings when a player did not play', function(){
          var settings = {
              tau : 0.5,
              rpd : 604800,
              rating : 1500,
              rd : 200,
              vol : 0.06
            };
            var glicko = new glicko2.Glicko2(settings);
            var Ryan = glicko.makePlayer();
            var matches = [];
            glicko.updateRatings(matches);
          });
        it('should accept Race objects', function(){
            var settings = {
                tau : 0.5,
                rpd : 604800,
                rating : 1500,
                rd : 200,
                vol : 0.06
            };
            var glicko = new glicko2.Glicko2(settings);
            var Ryan = glicko.makePlayer();
            var Bob = glicko.makePlayer(1400, 30, 0.06);
            var John = glicko.makePlayer(1550, 100, 0.06);
            var Mary = glicko.makePlayer(1700, 300, 0.06);

            var race = glicko.makeRace(
                [
                    [Ryan], //Ryan won the race
                    [Bob, John], //Bob and John 2nd position ex-aequo
                    [Mary] // Mary 4th position
                ]
            );

            glicko.updateRatings(race);

      // console.log(Ryan.getRating(), Ryan.getRd(), Ryan.getVol());
        //v1
            (Math.abs(Ryan.getRating() - 1685.7) < 0.1).should.equal(true);
            (Math.abs(Ryan.getRd() - 151.52) < 0.01).should.equal(true);
            (Math.abs(Ryan.getVol() - 0.06000) < 0.00001).should.equal(true);
      //v2
            // (Math.abs(Ryan.getRating() - 1563.6) < 0.1).should.equal(true);
            // (Math.abs(Ryan.getRd() - 175.40) < 0.01).should.equal(true);
            // (Math.abs(Ryan.getVol() - 0.06) < 0.00001).should.equal(true);
        });
      });
      describe('predict()', function(){
        it('should calculate expected outcome', function(){
            var settings = {
                tau : 0.5,
                rpd : 604800,
                rating : 1500,
                rd : 200,
                vol : 0.06
            };
            var glicko = new glicko2.Glicko2(settings);
            var p1 = glicko.makePlayer(1500, 100, 0.06);
            var p2 = glicko.makePlayer(1300, 100, 0.06);
            var expected = p1.predict(p2);

            (Math.abs(expected - 0.74) < 0.001).should.equal(true);

            var gexpected = glicko.predict(p1, p2);
            gexpected.should.equal(expected);
        });
      });
  });

describe("Race", function(){
    describe("getMatches", function(){
        it("Should convert a race to a list of matches", function(){
            var settings = {
                tau : 0.5,
                rpd : 604800,
                rating : 1500,
                rd : 200,
                vol : 0.06
            };
            var glicko = new glicko2.Glicko2(settings);
            var Ryan = glicko.makePlayer();
            var Bob = glicko.makePlayer(1400, 30, 0.06);
            var John = glicko.makePlayer(1550, 100, 0.06);
            var Mary = glicko.makePlayer(1700, 300, 0.06);

            var race = glicko.makeRace(
                [
                    [Ryan], //Ryan won the race
                    [Bob, John], //Bob and John 2nd position ex-aequo
                    [Mary] // Mary 4th position
                ]
            );

            var matches = race.getMatches();
      //v1
            matches.should.eql([
                [Ryan, Bob, 1],
                [Ryan, John, 1],
                [Ryan, Mary, 1],
                [Bob, John, 0.5],
                [Bob, Mary, 1],
                [John, Mary, 1]
            ]);
      //v2
            // matches.should.eql([
            //     [Ryan, Bob, 1],
            //     [Bob, John, 0.5],
            //     [John, Mary, 1]
            // ]);
        })
    });

  function calculatePrecision(scoreRatings){
    var predictionOk = 0;
    var predictionCount = 0;
    while(scoreRating = scoreRatings.pop()){
      scoreRatings.forEach(adversary => {
        predictedWin = scoreRating.rating > adversary.rating;
        realWin = scoreRating.score > adversary.score;
        if (predictedWin == realWin){
          predictionOk += 1;
        }
        predictionCount += 1;
      });
    }
    return predictionOk / predictionCount;
  }

  function makeRound(ranking, players, realRatings) {
    let playerScores = realRatings.map(function(real, i) {
      let score = Math.ceil(getNormallyDistributedRandomNumber(real, 150));
      return {
        real,
        score,
        player: players[i]
      };
    }).sort((a,b) => b.score - a.score);

    let scoreRatings = playerScores.map(pscore => ({
      score: pscore.score,
      rating: pscore.player.getRating(),
    }));

    let idealRatings = playerScores.map(pscore => ({
      score: pscore.score,
      rating: pscore.real,
    }));

    let realPrecision = calculatePrecision(idealRatings);
    let rankingPrecision = calculatePrecision(scoreRatings);

    let raceResults = [];
    let current = [];
    playerScores.forEach(function(pscore) {
      if (current.length && current[0].score == pscore.score){
        current.push(pscore);
      } else {
        raceResults.push(current.map((currScore) => currScore.player));
        current = [pscore];
      }
    });
    raceResults.push(current.map((currScore) => currScore.player));

    var race = ranking.makeRace(raceResults);
    ranking.updateRatings(race);

    return {
      realPrecision,
      rankingPrecision
    };
  }

  // XXX : trying to replicate http://www.tckerrigan.com/Misc/Multiplayer_Elo/ procedure to test accuracy of the algorithm
  describe("evaluateAlgorithm", function(){
    it("Should approximate reality", function(){
      var settings = {
        tau : 0.5,
        rpd : 604800,
        rating : 1500,
        rd : 200,
        vol : 0.06
      };
      var ranking = new glicko2.Glicko2(settings);

      let nbPlayers = 10;
      var players = [];
      var realRatings = [];
      var diff = 1; // add or substract 1 alternatively
      for (let idx = 0; idx < nbPlayers; idx++) {
        realRatings.push(1100 + 100*idx);
        players.push(ranking.makePlayer(1500 + diff, 200, 0.06));
        diff = 0 - diff;
      }

      let precisions = [];
      for (let numRound = 1; numRound < 50; numRound++) {
        precisions = makeRound(ranking, players, realRatings);
        // console.log(precisions.realPrecision, precisions.rankingPrecision);
      }
      // (Math.abs(precisions.realPrecision - precisions.rankingPrecision) < 0.01).should.equal(true);
    });
  })

})

