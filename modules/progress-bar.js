//Displays a cute little progress bar
module.exports = function () {
  this.showProgress = (current, total) => {
    let length = process.stdout.columns - 30;
    let progress = (current/total);

    let percentage = (progress*100).toFixed(1);
    let filled = (progress*length).toFixed(0);
    let unfilled = length-filled;

    let bar = '['+'█'.repeat(filled)+'░'.repeat(unfilled)+']';

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(bar+' '+percentage+'%');

    if (progress == 1) {
      process.stdout.write('\nFinished!\n');
    }
  }
}
