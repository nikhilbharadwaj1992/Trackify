function getMongoServiceUrl() {
    //Replace it with the Mongo DB API URL
	return "http://localhost:1337/";
}

function getDocumentServiceUrl() {
    //Replace it with the Document DB API URL
	return "http://localhost:3000/";
}

angular.module('naukriplugin', []).controller('naukripluginctrl', function($scope, $http) {
    
    //Service call to get the list of collections
    $http.get(getMongoServiceUrl() + "api/getAllActiveJobs").then(function (response) {
        $scope.collections = response.data;            	
    }, function (err) {
        alert(err.status);
    });

    //Service call to add or update documents in a collection
    $scope.addToCollection = function(collection) {
        $http.post(getDocumentServiceUrl() + "add-candidate?collectionid=" + collection, window.candidate).then(function (response) {
            if (response.data.status == 'ADD_SUCCESS' || response.data.status == 'UPDATE_SUCCESS') {
                $scope.message = response.data.message;
            }                     	
        }, function (err) {
            alert(err.status);
        });
    }

});
