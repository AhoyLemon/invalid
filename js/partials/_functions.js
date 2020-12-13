function countVowels(word) {
  let vowelCount = 0;
  let matchingInstances = word.match(/[AEIOU]/gi);
  if (matchingInstances) {
    vowelCount = matchingInstances.length;
  }
  return vowelCount;
}