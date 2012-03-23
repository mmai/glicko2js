var glicko2 = require('../glicko2');

describe('Player', function(){
    describe('getRating()', function(){
        it('should return a default rating of 1500', function(){
            this.player = new glicko2.Player();
            this.player.getRating().should.equal(1500);
          });
      });

    describe('getRd()', function(){
        it('should return a default rd of 200', function(){
            this.player = new glicko2.Player();
            this.player.getRd().should.equal(200);
          });
      });

    describe('vol', function(){
        it('should return a default vol of 0.06', function(){
            this.player = new glicko2.Player();
            this.player.vol.should.equal(0.06);
          });
      });

    // Following the example at:
    // http://math.bu.edu/people/mg/glicko/glicko2.doc/example.html
    // Pretend Ryan (of rating 1500 and rating deviation 350) plays players of ratings 1400, 1550 and 1700
    // and rating deviations 30, 100 and 300 respectively with outcomes 1, 0 and 0.
    describe('update_player()', function(){
        it('should calculate a new rating', function(){
            this.player = new glicko2.Player();
            this.player.update_player([1400, 1550, 1700], [30, 100, 300], [1, 0, 0]);
            (Math.abs(this.player.getRating() - 1464.06) < 0.01).should.be.true;
            (Math.abs(this.player.getRd() - 151.52) < 0.01).should.be.true;
            (Math.abs(this.player.vol - 0.05999) < 0.00001).should.be.true;
          });
      });
  });

