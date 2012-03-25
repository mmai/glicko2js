var glicko2 = require('../glicko2');

describe('Ranking', function(){
    describe('makePlayer()', function(){
        it('should make a default player', function(){
            var settings = {
              tau : 0.5,
              rpd : 604800,
              rating : 1500,
              rd : 200,
              vol : 0.06
            };
            var ranking = new glicko2.Ranking(settings);
            var player = ranking.makePlayer();
            player.getRating().should.equal(settings.rating);
            player.getRd().should.equal(settings.rd);
            player.getVol().should.equal(settings.vol);
          });
      });
    describe('stopPeriod()', function(){
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
            var ranking = new glicko2.Ranking(settings);
            var Ryan = ranking.makePlayer();
            var Bob = ranking.makePlayer(1400, 30, 0.06);
            var John = ranking.makePlayer(1550, 100, 0.06);
            var Mary = ranking.makePlayer(1700, 300, 0.06);

            ranking.startPeriod();
            ranking.addResult(Ryan, Bob, 1); //Ryan won over Bob
            ranking.addResult(Ryan, John, 0); //Ryan lost against John
            ranking.addResult(Ryan, Mary, 0); //Ryan lost against Mary
            ranking.stopPeriod();

            (Math.abs(Ryan.getRating() - 1464.06) < 0.01).should.be.true;
            (Math.abs(Ryan.getRd() - 151.52) < 0.01).should.be.true;
            (Math.abs(Ryan.getVol() - 0.05999) < 0.00001).should.be.true;
          });
      });
  });

