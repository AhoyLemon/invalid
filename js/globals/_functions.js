function randomNumber(min,max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function randomFrom(array) {
  return array[Math.floor(Math.random()*(array.length))];
}

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function addCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function findInArray(haystack,needle) {
  let n = haystack.indexOf(needle);
  if (n > -1) {
    return n;
  } else {
    return null;
  }
}

function removeFromArray(haystack,needle) {
  for( var i = haystack.length-1; i--;){
    if ( haystack[i] == needle) { 
      haystack.splice(i, 1);
    }
  }
}


function percentOf(total,part) {
  if (total == 0 || part == 0) {
    return 0;
  } else {
    return Math.round((part * 100) / total);
  }
  
}

function sendEvent(c, a, l, v) {
  if (v) {
    ga('send', 'event', { eventCategory: c, eventAction: a, eventLabel: l, eventValue:v });
    //console.log('CATEGORY: '+c+', ACTION:'+a+', LABEL:'+l+', VALUE:'+v);
  } else if (l) {
    ga('send', 'event', { eventCategory: c, eventAction: a, eventLabel: l });
    //console.log('CATEGORY: '+c+', ACTION:'+a+', LABEL:'+l);
  } else {
    ga('send', 'event', { eventCategory: c, eventAction: a });
    //console.log('CATEGORY: '+c+', ACTION:'+a);
  }
}