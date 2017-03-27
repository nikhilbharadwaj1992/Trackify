function getServiceUrl() {
    //Replace it with the Mongo DB API URL
	// return "http://localhost:9000/";
    return "http://talenttrack.azurewebsites.net/";
}

angular.module('naukriplugin', []).controller('naukripluginctrl', function($scope, $http) {
    
    //Service call to get the list of collections
    $http.get(getServiceUrl() + "api/jobs/getAllActiveJobs").then(function (response) {
        $scope.collections = response.data.data;            	
    }, function (err) {
        alert(err.status);
    });

    //Service call to add or update documents in a collection
    $scope.addToCollection = function(collection) {
        var obj = window.candidate;
        obj.jobId = parseInt(collection);
        $http.post(getServiceUrl() + "api/jobs/add-candidate", obj).then(function (response) {
            if (response.data.status == 'SUCCESS') {
                $scope.message = response.data.message || response.data.err;
            }                     	
        }, function (err) {
            alert(err.status);
        });
    }

});
