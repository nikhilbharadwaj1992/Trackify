var app = angular.module('naukriplugin', ['ngSanitize', 'ui.select']);

function getServiceUrl() {
    //Replace it with the Mongo DB API URL
	// return "http://localhost:9000/";
    return "http://talenttrack.azurewebsites.net/";
}

/**
 * AngularJS default filter with the following expression:
 * "person in people | filter: {name: $select.search, age: $select.search}"
 * performs an AND between 'name: $select.search' and 'age: $select.search'.
 * We want to perform an OR.
 */
app.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      var keys = Object.keys(props);

      items.forEach(function(item) {
        var itemMatches = false;

        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

app.controller('naukripluginctrl', function($scope, $http) {

    var _this = this;
    
    //Service call to get the list of collections
    $http.get(getServiceUrl() + "api/jobs/getAllActiveJobs").then(function (response) {
        var _collections = [];
        var _response = response.data.data; 
        _response.map((e) => {
            if (e.clientName && e.primarySkill) {
                _collections.push(e);
            }
        });	
        _this.collections = _collections;
    }, function (err) {
        alert(err.status);
    });

    //Service call to add or update documents in a collection
    $scope.addToCollection = function(collection) {
        var obj = window.candidate;
        obj.jobId = collection._id;
        $http.post(getServiceUrl() + "api/jobs/add-candidate", obj).then(function (response) {
            $scope.message = response.data.message || response.data.err;                 	
        }, function (err) {
            alert(err.status);
        });
    }

});
