//@prepros-prepend globals/_functions.js

//@prepros-append wrongest/_vue.js

//@prepros-append wrongest/_sockets.js 



// Register a global custom directive called `v-focus`
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function (el) {
    // Focus the element
    el.focus();
  }
});