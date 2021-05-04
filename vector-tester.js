const createCSVWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const fs = require('fs');
const mds = require('./modules')();
const prompt = require('prompt-sync')();

var vector = [];

fs.createReadStream('data/trained/vector.csv')
  .on('error', () => {
    console.log('Word vector does not exist...\nExiting');
    return
  })
  .pipe(csv())
  .on('data', (row) => {
    vector.push(row);
  })
  .on('end', () => {
    console.log('Word vector loaded...');
    tester();
  });

function tester() {
  let words = [];
  while (true) {
    console.log('Receiving commands.');
    let comm = prompt();
    switch(comm) {
      case '-end':
        return;
      case '-ms':
        let word_v = getVectors(1);

        let mostSimilar = [];
        let numWords = 10;

        vector.forEach((vec) => {
          if (vec.word != word_v.word) {
            let vecCS = cosSimilarity(word_v, vec);
            let vecDist = vectorLength(word_v, vec);

            mostSimilar.push({
            word: vec.word,
            cs: vecCS,
            dist: vecDist
            });

            mostSimilar.sort((a,b) => b.cs-a.cs);

            if (mostSimilar.length > numWords) {
              mostSimilar.splice(numWords, 1);
            }
          }
        });

        mostSimilar.forEach((ms) => {
          console.log(ms);
        });
        break;
      default:
        let wordVs = getVectors(2);

        console.log('Cosine similarity: ' + cosSimilarity(wordVs[0], wordVs[1]));
    }
  }
}

function getVectors(num) {
  if (num < 1) err('Invalid num value.');

  let words = [];
  for (i = 0; i < num; i++) {
    console.log('Please type a word.');
    var word = prompt();
    //Check whether already vectorized
    let word_v = vector.find(v => v.word == word.toLowerCase());
    if (word_v == null) { //If not,
      console.log('"' + word + '" is not vectorized, please choose another.');
      i--;
    } else {
      words.push(word_v);
    }
  }
  if (num == 1) return words[0]
  return words;
}
