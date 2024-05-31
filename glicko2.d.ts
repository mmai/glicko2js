declare module 'glicko2' {
    export class Glicko2 {
        /**
         * Constructs a new Glicko2 instance with optional settings.
         * @param settings - Optional settings to configure the Glicko2 instance.
         */
        constructor(settings?: Glicko2Settings);

        /**
         * Creates a new Race instance.
         * @param results - The results of the race.
         * @returns A new Race instance.
         */
        makeRace(results: Player[][]): Race;

        /**
         * Removes all players from the system.
         */
        removePlayers(): void;

        /**
         * Gets all players in the system.
         * @returns An array of all players.
         */
        getPlayers(): Player[];

        /**
         * Cleans previous matches for all players.
         */
        cleanPreviousMatches(): void;

        /**
         * Calculates the ratings for all players.
         */
        calculatePlayersRatings(): void;

        /**
         * Adds a match result between two players.
         * @param player1 - The first player.
         * @param player2 - The second player.
         * @param outcome - The outcome of the match: 0 = defeat, 1 = victory, 0.5 = draw.
         * @returns An object containing the two players.
         */
        addMatch(player1: Player, player2: Player, outcome: number): { pl1: Player, pl2: Player };

        /**
         * Creates a new Player instance.
         * @param rating - The rating of the player.
         * @param rd - The rating deviation of the player.
         * @param vol - The volatility of the player.
         * @returns A new Player instance.
         */
        makePlayer(rating: number, rd?: number, vol?: number): Player;

        /**
         * Adds a result for a player.
         * @param player1 - The first player.
         * @param player2 - The second player.
         * @param outcome - The outcome of the match.
         */
        addResult(player1: Player, player2: Player, outcome: number): void;

        /**
         * Updates the ratings of players based on the matches.
         * @param matches - The matches to be used for updating ratings.
         */
        updateRatings(matches: Race | [Player, Player, number][]): void;

        /**
         * Predicts the outcome between two players.
         * @param player1 - The first player.
         * @param player2 - The second player.
         * @returns The predicted outcome.
         */
        predict(player1: Player, player2: Player): number;

        /**
         * Internal method to create a new Player instance.
         * @param rating - The rating of the player.
         * @param rd - The rating deviation of the player.
         * @param vol - The volatility of the player.
         * @param id - The ID of the player.
         * @returns A new Player instance.
         */
        private _createInternalPlayer(rating?: number, rd?: number, vol?: number, id?: number): Player;
    }

    /**
     * Settings to configure the Glicko2 instance.
     */
    export interface Glicko2Settings {
        /**
         * The system constant which constrains changes in volatility (tau).
         * Defaults to 0.5
         */
        tau?: number;

        /**
         * The initial rating for players.
         * Defaults to 1500
         */
        rating?: number;

        /**
         * The initial rating deviation for players.
         * Defaults to 350
         */
        rd?: number;

        /**
         * The initial volatility for players.
         * Defaults to 0.06
         */
        vol?: number;

        /**
         * The algorithm to use for volatility calculation.
         * Defaults to 'newprocedure'
         */
        volatility_algorithm?: 'oldprocedure' | 'newprocedure' | 'newprocedure_mod' | 'oldprocedure_simple';
    }

    export class Race {
        /**
         * Constructs a new Race instance.
         * @param results - The results of the race.
         */
        constructor(results: Player[][]);

        /**
         * Gets the matches for the race.
         * @returns An array of matches.
         */
        getMatches(): Player[][];

        /**
         * Computes the matches for the race.
         * @param results - The results of the race.
         * @returns An array of matches.
         */
        computeMatches(results: Player[][]): Player[][];

        /**
         * Computes the matches for the race using the v2 algorithm.
         * @param results - The results of the race.
         * @returns An array of matches.
         */
        computeMatches_v2(results: Player[][]): Player[][];
    }

    export class Player {
        /**
         * Constructs a new Player instance.
         * @param rating - The rating of the player.
         * @param rd - The rating deviation of the player.
         * @param vol - The volatility of the player.
         * @param tau - The system constant which constrains changes in volatility (tau).
         * @param default_rating - The default rating for new players.
         * @param volatility_algorithm - The function for calculating volatility.
         * @param id - The ID of the player.
         */
        constructor(
            rating: number,
            rd: number,
            vol: number,
            tau: number,
            default_rating: number,
            volatility_algorithm: (v: number, delta: number) => number,
            id: number
        );

        /**
         * Gets the rating of the player.
         * @returns The rating of the player.
         */
        getRating(): number;

        /**
         * Sets the rating of the player.
         * @param rating - The new rating of the player.
         */
        setRating(rating: number): void;

        /**
         * Gets the rating deviation of the player.
         * @returns The rating deviation of the player.
         */
        getRd(): number;

        /**
         * Sets the rating deviation of the player.
         * @param rd - The new rating deviation of the player.
         */
        setRd(rd: number): void;

        /**
         * Gets the volatility of the player.
         * @returns The volatility of the player.
         */
        getVol(): number;

        /**
         * Sets the volatility of the player.
         * @param vol - The new volatility of the player.
         */
        setVol(vol: number): void;

        /**
         * Adds a result for the player.
         * @param opponent - The opponent player.
         * @param outcome - The outcome of the match.
         */
        addResult(opponent: Player, outcome: number): void;

        /**
         * Updates the rank of the player.
         */
        update_rank(): void;

        /**
         * Checks if the player has played any matches.
         * @returns True if the player has played, false otherwise.
         */
        hasPlayed(): boolean;

        /**
         * Updates the rating deviation for the beginning of a rating period.
         */
        _preRatingRD(): void;

        /**
         * Calculates the estimated variance of the player's rating based on game outcomes.
         * @returns The variance.
         */
        _variance(): number;

        /**
         * Calculates the expected outcome using the Glicko E function.
         * @param p2rating - The rating of the opponent.
         * @param p2RD - The rating deviation of the opponent.
         * @returns The expected outcome.
         */
        _E(p2rating: number, p2RD: number): number;

        /**
         * Predicts the outcome of a match against another player.
         * @param p2 - The opponent player.
         * @returns The predicted outcome.
         */
        predict(p2: Player): number;

        /**
         * The Glicko2 g(RD) function.
         * @param RD - The rating deviation.
         * @returns The g(RD) value.
         */
        _g(RD: number): number;

        /**
         * Calculates the estimated improvement in rating.
         * @param v - The variance.
         * @returns The delta value.
         */
        _delta(v: number): number;

        /**
         * Creates a function for volatility calculation.
         * @param delta - The delta value.
         * @param v - The variance.
         * @param a - The a value.
         * @returns A function for volatility calculation.
         */
        _makef(delta: number, v: number, a: number): (x: number) => number;
    }
}
