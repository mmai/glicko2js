var glicko2 = require('../glicko2');

describe('Glicko2', function(){
    describe('makePlayer()', function(){
        var settings = {
          tau : 0.5,
          rpd : 604800,
          rating : 1500,
          rd : 350,
          vol : 0.06
        };
        var glicko = new glicko2.Glicko2(settings);
        it('should make a default player', function(){
            var player = glicko.makePlayer();
            player.getRating().should.equal(settings.rating);
            player.getRd().should.equal(settings.rd);
            player.getVol().should.equal(settings.vol);
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

            (Math.abs(Ryan.getRating() - 1464) < 0.1).should.be.true;
            (Math.abs(Ryan.getRd() - 152) < 0.1).should.be.true;
            (Math.abs(Ryan.getVol() - 0.05999) < 0.00001).should.be.true;
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
            console.log('nb players: ' + glicko.getPlayers().length);

            //Fist tournament for the second ranking instance, with the same matches
            var matches_new = [];
            matches_new.push([Ryan_new, Bob_new, 0]);
            matches_new.push([Ryan_new, John_new, 1]);
            matches_new.push([Mary_new, Bob_new, 1]);
            glicko_new.updateRatings(matches_new);

            //The ratings in both systems should be the same 
            (Math.abs(Ryan.getRating() - Ryan_new.getRating()) < 0.1).should.be.true;
            (Math.abs(Ryan.getRd() - Ryan_new.getRd()) < 0.1).should.be.true;
            (Math.abs(Ryan.getVol() - Ryan_new.getVol()) < 0.00001).should.be.true;
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
      });
  });

