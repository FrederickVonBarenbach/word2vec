const createCSVWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const pb = require('./modules')();

fs.readdir('data/texts', function (err, files) {
  //handling error
  if (err) {
      return console.log('Unable to scan directory: ' + err);
  }
  //using recursion to process ever file
  readFile(files, 0);
});

//==============================================================================

function readFile(files, index) {
  //Check if recursion has ended
  if (files.length == index) return console.log('Processing completed!');
  //Only process csv files
  let fileName = files[index];
  if (!fileName.includes('.txt')) return readFile(files, index+1);

  var csvWriter = createCSVWriter({
    path: 'data/processed/' + generateCSVName(fileName),
    header: [
      {id: 'speaker', title: 'speaker'},
      {id: 'text', title: 'text'}
    ]
  });

  fs.readFile('data/texts/' + fileName, 'utf-8', function(err, text) {
    if (err) throw err;
    //Perform the processing
    console.log('Processing file "' +  fileName + '"');
    var t_set = processText(text);
    //Save the csv and call the recursion
    csvWriter
      .writeRecords(t_set)
      .then(() => {
        console.log(fileName + ' file processed!');
        return readFile(files, index+1);
      });
  });
}
//Change the name of the txt file to the csv file "format"
function generateCSVName(fileName) {
  let str = fileName.replace('.txt', '');
      str = str.replace(new RegExp(' ', 'gmi'), '-');

  return str.toLowerCase() + '.csv';
}

//==============================================================================

//NOTE: might need to convert txt files to rtf and then back to txt
function processText(text) {
  //text = text.substring(0, 3000); //OPTIONAL: SMALLER SAMPLE SIZE

  let regex = new RegExp('<[^>]+>[^<]+<[0-9]{1,3}%>[^<]+<[^>]+>', 'gmi');
                       //This is so that we can get the name of the "speaker"
                                      //This is so that we can identify that it is dialogue
                                                   //This is the text
                                                       //This is the end
  let str = text.match(regex);
  let str_size = str.length-1;

  var t_set = [];

  str.forEach((s, i) => {
    let speaker = s.substring(s.indexOf('<')+1, s.indexOf('>')); //Gets string for speaker
    let text = s.substring(s.indexOf('%>')+3, s.indexOf('<', s.indexOf('%>')+3)); //Gets dialogue
    text = text.replace(new RegExp('\t', 'gmi'), '') //Removes tab
               .replace(new RegExp('\n', 'gmi'), ' '); //Replaces newline with space

    if (text != '') {
      t_set.push({
        speaker: speaker.toLowerCase(),
        text: text.toLowerCase()
      });
      showProgress(i, str_size);}
  });

  return t_set;
}
