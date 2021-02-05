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
    sortedList(list) {
      function compare(a, b) {
        if (a.count < b.count)
          return 1;
        if (a.count > b.count)
          return -1;
        return 0;
      }
      if (list && list.length > 1) {
        return list.sort(compare);
      } else {
        return list;
      }
      
    },

    sortByScore(list) {
      function compare(a, b) {
        if (a.score > b.score)
          return 1;
        if (a.score < b.score)
          return -1;
        return 0;
      }
      if (list && list.length > 1) {
        return list.sort(compare);
      } else {
        return list;
      }
    },

    formatQuote(quote) {
      return quote.replace('{','').replace('}','');
    },

    formatTime(stamp,format) {
      if (format == "fromNow") {
        return moment(stamp).fromNow();
      } else if (format == "calendar") {
        if (moment(stamp).diff(moment(),'days') > -7) {
          return moment(stamp).calendar();
        } else {
          return moment(stamp).format('MMM Do @ LT');
        }
      } else if (format) {
        return moment(stamp).format(format);
      } else {
        return moment(stamp).format('LLLL');
      }
    },
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
