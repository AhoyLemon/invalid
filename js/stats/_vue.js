var app = new Vue({
  el: '#app',
  data: {
    h1: 'It works.',
    stats: {
      general: {},
      invalid: {},
      wrongest: {}
    }
  },

  methods: {

  },

  computed: {

  },

  created: function() {
    const self = this;
    axios.get('/general/stats/json')
      .then(function (response) {
        // handle success
        self.stats.general = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });

    
    axios.get('/invalid/stats/json')
      .then(function (response) {
        // handle success
        self.stats.invalid = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });

    axios.get('/wrongest/stats/json')
      .then(function (response) {
        // handle success
        self.stats.wrongest = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  }

});
