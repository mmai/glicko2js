var glicko2 = require('../glicko2');

describe('Glicko2', function(){
    describe('makePlayer()', function(){
        var settings = {
          tau : 0.5,
          rpd : 604800,
          rating : 1500,
          rd : 200,
          vol : 0.06
        };
        var glicko = new glicko2.Glicko2(settings);
        it('should make a default player', function(){
            var player = glicko.makePlayer();
            player.getRating().should.equal(settings.rating);
            player.getRd().should.equal(settings.rd);
            player.getVol().should.equal(settings.vol);
          });
        it('should make only one player by id', function(){
            var pl1 = glicko.makePlayer(1400, 30, 0.06, "e");
            var pl2 = glicko.makePlayer(1550, 100, 0.06, "e");
            var pl3 = glicko.makePlayer(1550, 100, 0.06, 77);
            var pl4 = glicko.makePlayer(1550, 100, 0.06, 77);
            var pl5 = glicko.makePlayer(1550, 100, 0.06);
            //pl1 = pl2, pl3 = pl4, pl5, and the player from previous test
            Object.keys(glicko.players).length.should.equal(4);
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
            var Bob = glicko.makePlayer(1400, 30, 0.06, 'bob');
            var John = glicko.makePlayer(1550, 100, 0.06, 'john');
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

            (Math.abs(Ryan.getRating() - 1464.06) < 0.01).should.be.true;
            (Math.abs(Ryan.getRd() - 151.52) < 0.01).should.be.true;
            (Math.abs(Ryan.getVol() - 0.05999) < 0.00001).should.be.true;
          });
      });
  });

