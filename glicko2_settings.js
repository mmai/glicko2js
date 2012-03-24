exports = {
  // tau "Reasonable choices are between 0.3 and 1.2, though the system should be tested to decide which value results in greatest predictive accuracy."
  tau : 0.5,
  rpd : 604800,//rating period duration in seconds (one week = 604800)
  //default rating
  rating : 1500,
  //Default rating deviation (small number = good confidence on the rating accuracy)
  rd : 200,
  //Default volatility (expected fluctation on the player rating)
  vol : 0.06
};
