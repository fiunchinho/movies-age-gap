const Rx = require('rx');
const moment = require('moment');
const cacheManager = require('cache-manager');

// setup a cache object
const cache = cacheManager.caching({
    store: 'memory',
    max: 500 // keep maximum 500 different URL responses
});

const rp = require('request-plus');
const request = rp({
    defaults: {
        json: true
    },
    // use retry wrapper
    retry: {
        attempts: 1
    },

    // use cache wrapper
    cache: {
        cache: cache,
        cacheOptions: {
            ttl: 30
        }
    }
});

MALE = 2;
FEMALE = 1;
API_KEY = "d9ac655b6ed549002013c5b4262dfa13";

function getPopularMovies() {
    // return request({uri: 'http://api.themoviedb.org/3/movie/popular?api_key=' + API_KEY}).then(function(movies_response){
    return request({uri: 'https://api.themoviedb.org/3/discover/movie?without_genres=animation&language=es-ES&sort_by=vote_count.desc&api_key=' + API_KEY}).then(function(movies_response){
        return movies_response;
    });
}
function getMovieCast(movie) {
    return request({uri: 'http://api.themoviedb.org/3/movie/' + movie.id + '/credits?api_key=' + API_KEY}).then(function(movie_response){
        return movie_response.cast;
    })
}
function getPerson(cast) {
    return request({uri: "http://api.themoviedb.org/3/person/" + cast.id + "?api_key=" + API_KEY}).then(function (person) {
        return person;
    });
}

Rx.Observable
    .of(1)
    .flatMap(function(uri){
        return Rx.Observable.fromPromise(getPopularMovies());
    })
    .flatMap(function(movies){
        return Rx.Observable.from(movies.results);
    })
    .do(function(movie){
        console.log(movie.original_title);
    })
    .concatMap(function(cast) {
        return Rx.Observable.just(cast).delay(1000);
    })
    .flatMap(function(movie){
        return Rx.Observable.fromPromise(getMovieCast(movie));
    })
    .flatMap(function(cast){
        return Rx.Observable.from(cast.slice(0, 4));
    })
    .concatMap(function(cast) {
        return Rx.Observable.just(cast).delay(1000);
    })
    .flatMap(function(cast){
        return Rx.Observable.fromPromise(getPerson(cast));
    })
    .do(function(person){
        console.log(person.name);
    })
    .map(function(person){
        person.age = moment().diff(moment(person.birthday, "YYYY-MM-DD"), 'years');
        return person;
    })
    .filter(function(person){
        return !isNaN(person.age);
    })
    .groupBy(function (person) { return person.gender; })
    .flatMap(function(group) {
        return group.average(function(person) {
            return person.age;
        });
    })
    .do(function(years){
        console.log(years);
    })
    .subscribe();



