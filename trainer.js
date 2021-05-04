const createCSVWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const fs = require('fs');
const mds = require('./modules')();
const emitter = require('events').EventEmitter;
const vectorPath = 'data/trained/vector.csv';

//==============================================================================
//NEXT STEPS:
//1. Remove repeated cases ('ll and 's)
//2. Edit params and full stop disassociation cases (after full stops squeeze less)
//==============================================================================

var vectorHead = vectorHeader();
var fileNames = [];
var vector = [];
const compareParams = [0.1, 0.1, 0.08, 0.08, 0.05, 0.05, 0.03, 0.03, 0.01];
//************************************************************************
//After punctuation, reduce the params by like (*2 or -0.01) so that words
//after punctuation have less association
//I think something like n-(n/2) or n-(n/1.5)
//************************************************************************

fs.readdir('data/processed', function (err, files) {
  //handling error
  if (err) {
      return console.log('Unable to scan directory: ' + err);
  }
  loadVector().on('end', () => {     //Might need to add 'new'
    //using recursion to vectorize ever csv
    loadData(files, 0);
  });
});

//==============================================================================
function loadData(files, index) {
  //Check if recursion has ended
  if (files.length == index) return console.log("Training completed!");
  //Only vectorize csv files
  let fileName = files[index];
  if (!fileName.includes('.csv')) return loadData(files, index+1);

  var t_set = [];

  fs.createReadStream('data/processed/' + fileName)
    .pipe(csv())
    .on('data', (row) => {
      t_set.push(row);
    })
    .on('end', () => {
      console.log('Training set "' +  fileName + '" loaded...');

      let set_size = t_set.length-1;
      //Perform the training (and display bar)
      t_set.forEach((t, i) => {
        train(t.text);
        showProgress(i, set_size);
      });
      //Save the file and call the recursion
      saveVector().on('end', () => {
        console.log('Training from "' +  fileName + '" completed!');
        return loadData(files, index+1);
      });
    });
}

  //==============================================================================

  function train(text) {
    var words = text.split(' ');

    words.forEach((curWord, i) => {
      compareVector();

      function getVector(word, index) {
        if (word != '') { //Does not operate on empty strings
          let regex = new RegExp('[\\.—,:;!\\?]', 'gmi'); //Chars that will be removed from text
          word = word.replace(regex,' '); //Removes chars (from above)
          if (word.split(' ').length > 1) { //Check whether word is actually multiple words
            word.split(' ').forEach((word_, j) => { //With punctuation between
              if (j == 0) {
                words.splice(index+j, 1, word_) //The first word replaces the current one
                word = word_; //The only words that can affect order are those that appear
                              //after the current word since those that appear before have
                              //already been covered earlier in the loop
              } else if (word_ != '') {
                words.splice(index+j, 0, word_); //Add rest of words to words list
              }
            });
          }

          let word_v = vector.find(v => v.word == word); //Check whether already vectorized
          if (word_v == null) { //If not, make new vector
            word_v = makeVector(word);
            vector.push(word_v);
          }
          return word_v;
        }
        return null;
      }

      function compareVector() {
        let word_v = getVector(curWord, i);
        if (word_v == null) return;
        for (n = 0; n < compareParams.length+1; n++) {
          let k = n+i;
          //********************************************************************
          //TODO: Add a line that pushes random words away that are in the text
          //      and that are outside of the param range (so like, words that
          //      are further than 6 or something words from the current word)
          //********************************************************************
          if (k >= 0 && k < words.length && n != 0) {
            let neighbour_v = getVector(words[k], k); //Get neighbour vector
            if (neighbour_v == null) continue;

            let compareParam = compareParams[n-1]; //Get amount to bring vectors closer

            let vecDirA = vectorArithmetic(word_v, neighbour_v, '-'); //Get direction to word_v
            let vecDirB = vectorArithmetic(neighbour_v, word_v, '-'); //Get direction to neighbour_v
            let vecA = vectorArithmetic(neighbour_v, vecDirA, '+', 1-compareParam/2); //Squeeze along
            let vecB = vectorArithmetic(word_v, vecDirB, '+', 1-compareParam/2); //the given direction
            vecA.word = word_v.word;
            vecB.word = neighbour_v.word;

            updateVector(word_v, vecA); //Update
            updateVector(neighbour_v, vecB);
            word_v = vecA; //Make sure to change word_v
          }
        }
      }
    });
  }

  //==============================================================================

  function updateVector(oldVec, newVec) { //Update vector in vector list
    vector[vector.findIndex(v => v.word == oldVec.word)] = newVec;
  }

  //NOTE: Is the -1 to 1 necessary?? or can we use any random number???
  function makeVector(word) { //Make new vector where every component is chosen from a
    var o = new Object(); //normal distribution between -1 and 1
    o.word = word;
    for (i = 0; i < vectorSize; i++) {
      let num = 0.374*Math.atanh(1.98*(Math.random()-0.5)); //This is an arctanh function
      o[i.toString()] = num.toFixed(6); //that goes between -1 and 1 (when x=0, y=-1)
    }
    return o;
  }

  //==============================================================================

  function vectorHeader() {
    let header = []
    header.push({id: 'word', title: 'word'});
    for (i = 0; i < vectorSize; i++) {
      header.push({id: i.toString(), title: i.toString()});
    }
    header.push({id: 'length', title: 'length'});
    return header;
  }

  function loadVector() {
    let e = new emitter();

    fs.createReadStream('data/trained/vector.csv')
      .on('error', () => {
        console.log('Word vector does not exist...\nContinuing...');
        e.emit('end');
      })
      .pipe(csv())
      .on('data', (row) => {
        vector.push(row);
      })
      .on('end', () => {
        console.log('Word vector loaded...');
        e.emit('end');
      });
    return e;
  }

  function saveVector() {
    let e = new emitter();

    vector.sort(function(a, b){ //Sorts the list alphabetically
        if(a.word < b.word) { return -1; }
        if(a.word > b.word) { return 1; }
        return 0;
    });

    //Add a progress bar if this is taking a while
    vector.forEach((vec) => { //Determines length of every vector in list
      vec.length = vectorLength(vec);
    });
    //Overwrite the vector.csv file
    createCSVWriter({
      path: vectorPath,
      header: vectorHead
    }).writeRecords(vector)
      .then(()=> {
        console.log('Word vector saved...')
        e.emit('end');
      });
    return e;
  }
