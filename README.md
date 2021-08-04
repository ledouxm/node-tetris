Node v14.15

This app works with https://github.com/ledouxm/react-tetris

## Usage

-   `docker-compose up -d` to start the database
-   `yarn install`
-   `yarn start` for the genetic algorithm
-   `yarn start-api` for the api

## Routes

-   `/api/game/best` returns every moves of the current best game
-   `/api/evolutions` returns numeric informations about each generation (best, worst, average, median)
