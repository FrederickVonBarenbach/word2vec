module.exports = function () {
  //==============================================================================
  //NEXT STEPS:
  //1. Make it so that you don't need to indicate vector size and it can instead
  //   operate on vectors of any size
  //==============================================================================
  this.vectorSize = 30;

  //Check how similar two words are (between -1 and 1)
  this.cosSimilarity = (vec1, vec2) => {
    if (vec1.length == null) vec1.length = vectorLength(vec1);
    if (vec2.length == null) vec2.length = vectorLength(vec2);
    return (dotProduct(vec1, vec2) /
           (vec1.length*vec2.length)).toFixed(6);
  }

  //Dot product function
  this.dotProduct = (vec1, vec2) => {
    let sum = 0;
    for (i = 0; i < vectorSize; i++) {
      let prod_i = parseFloat(vec1[i.toString()])*parseFloat(vec2[i.toString()]);
      sum += prod_i;
    }
    return sum.toFixed(6);
  }

  //Length function (inner product)
  this.vectorLength = (vec1, vec2 = null) => {
    let length = 0;
    if (vec2 != null) vec1 = vectorArithmetic(vec2, vec1, '-');

    for (i = 0; i < vectorSize; i++) {
      let len_i = Math.pow(parseFloat(vec1[i.toString()]), 2);
      length += len_i;
    }
    return (Math.sqrt(length)).toFixed(6);
  }

  //Arithmetic functions with vectors
  this.vectorArithmetic = (vec1, vec2, arith = '', c2 = 1) => {
    let vec3 = new Object();
    vec3.word = '';
    let a = 1;
    if (arith == '-') a = -1;
    for (i = 0; i < vectorSize; i++) {
      let comp_i = (parseFloat(vec1[i.toString()])
                   +c2*a*parseFloat(vec2[i.toString()])).toFixed(6);
      vec3[i.toString()] = comp_i;
    }
    return vec3;
  }
}
