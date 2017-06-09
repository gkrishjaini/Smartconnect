angular.module('lookupCtrl', ['serviceProviderService'])
    .controller('lookupController', function(lookupAppService, spAppService, $timeout, $mdDialog, $scope, Auth, $rootScope, toaster) {

        var viewmodel = this;

        viewmodel.DisplaylookupValue = {};
        viewmodel.DisplaylookupValue = {
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: 2,
            paginationPageSizes: [10, 25, 50, 75],
            paginationPageSize: 10,
            columnDefs: [{
                name: 'id',
                visible: false
            }, {
                name: 'Lookup Type'
            }, {
                name: 'Lookup Value'
            }, {
                name: 'Description'
            }, {
                name: 'Enabled'
            }, {
                name: 'Effective From',
                type: 'date',
                cellFilter: 'date:\'dd/MM/yyyy\''
            }, {
                name: 'Effective To',
                type: 'date',
                cellFilter: 'date:\'dd/MM/yyyy\''
            }, {
                name: 'Action',
                cellTemplate: '<div class="col-lg-12"  layout="row" ng-show="(row.entity.serviceProviderId!=null && grid.appScope.l.serviceprovider.corporateLogin == false ) || grid.appScope.l.serviceprovider.corporateLogin == true" layout-align="center center"><button type="button"  style="margin-top: 5px;" ng-click="grid.appScope.l.showEditLookupValuePopup(row.entity.id,$event)" class="btn btn-sm btn-info">Edit</button><button type="button" style="margin-left: 5px;margin-top:5px;" ng-click="grid.appScope.l.showConfirm(row.entity.id)" class="btn btn-sm btn-danger">Delete</button></div>',
                width: '130',
                enableSorting: false
            }],

            rowHeight: 50,
        };
        $rootScope.editLookUpData = undefined;
        Auth.getUser()
            .success(function(data) {
                viewmodel.serviceprovider = data;
                  viewmodel.updateDisplayLookUpDataGrid();
            });

            viewmodel.showEditLookupValuePopup = function(id, ev) {
            $rootScope.referenceId=id;
            $rootScope.editLookUpData = undefined;
            lookupAppService.getLookUpItemValues(id, viewmodel.serviceprovider.id)
                .then(function(data) {
                    if (data[0]._id == $rootScope.referenceId) {
                        $rootScope.editLookUpData = data;
                        $rootScope.editLookUpData[0].childlookupEnabled = false;
                        $rootScope.editLookUpData[0].isVisible = false;
                        $rootScope.editLookUpData[0].childlookupType = null;
                    } else {
                        var parenttype = data[0].type;
                        angular.forEach(data[0].subCategory, function (item, key) {
                            if (item._id == $rootScope.referenceId) {
                                var list=[];
                                list.push(item);
                                $rootScope.editLookUpData = list;
                                $rootScope.editLookUpData[0].childlookupEnabled = true;
                                $rootScope.editLookUpData[0].isVisible = true;
                                $rootScope.editLookUpData[0].childlookupType =  $rootScope.editLookUpData[0].type;
                                $rootScope.editLookUpData[0].type = parenttype; 
                                $rootScope.parentselectedValue = data[0].value;                             
                            }
                        })
                    }

                    $mdDialog.show({
                        templateUrl: 'app/views/pages/lookup/create.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        controller: DialogController,
                        clickOutsideToClose: false,
                        fullscreen: true
                    });
                }, function(error) {
                console.log(error.statusText);
            });
        }
     
        viewmodel.showCreateLookupValuePopup = function(ev) {
            $rootScope.editLookUpData = undefined;
            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'app/views/pages/lookup/create.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: true
            }).then(function(answer) {
                //  $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                //$scope.status = 'You cancelled the dialog.';
            });
        };

        viewmodel.showCreateLookupTypePopup = function(ev) {
            $mdDialog.show({
                    controller: LookupTypeController,
                    templateUrl: 'app/views/pages/lookup/create.lookuptype.tmpl.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: true
                })
                .then(function(answer) {
                    //  $scope.status = 'You said the information was "' + answer + '".';

                }, function() {
                    //$scope.status = 'You cancelled the dialog.';
                });
        };


        viewmodel.showConfirm = function(id) {

            var confirm = $mdDialog.confirm()
                .title('Would you like to delete this LookUp Value?')
                //.textContent('All of the banks have agreed to forgive you your debts.')
                .ariaLabel('Lucky day')
                .targetEvent(id)
                .ok('Please do it!')
                .cancel('Sounds like a scam');
            $mdDialog.show(confirm).then(function() {
                lookupAppService.deletelookUp(id, viewmodel.serviceprovider.id)
                    .then(function(data) {
                        viewmodel.updateDisplayLookUpDataGrid();
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }, function() {

            });
        };

        lookupAppService.getLookupTypes()
            .then(function(lookupTypes) {
                viewmodel.lookupTypes = lookupTypes;
            }, function(error) {
                console.log(error.statusText);
            });

        function LookupTypeController($scope, $mdDialog, lookupAppService) {
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {

                $mdDialog.cancel();
            };
            $scope.answer = function(answer) {
                $mdDialog.hide(answer);
            };

            lookupAppService.getLookupTypesByProviderId(viewmodel.serviceprovider.id).then(function(lookupTypes) {
                $scope.lookupTypeData.parentLookupType = lookupTypes
                
            }, function(error) {
                console.log(error.statusText);
            });

            $scope.lookupTypeData = {};
            $scope.lookupTypeData.hasSubCategory = false;
            

            $scope.savelookupType = function() {
                if($scope.lookupTypeData.hasSubCategory == false){
                        $scope.lookupTypeData.parentLookupType = null;
                } 
                if (viewmodel.serviceprovider.corporateLogin != true) {
                    $scope.lookupTypeData.serviceProviderId = viewmodel.serviceprovider.id;
                }else{
                    $scope.lookupTypeData.serviceProviderId = null;
                }
                lookupAppService.createLookupType($scope.lookupTypeData)
                    .then(function(data) {
                        if (data.success) {
                            viewmodel.displayLookupTypesGrid();
                            $mdDialog.cancel();
                        } else {
                            $scope.error = true;
                            $scope.message = data.message;
                        }
                    }, function(error) {
                        console.log(error.statusText);
                    });                                                
            }

        };

        function DialogController($scope, $mdDialog, lookupAppService) {

            $scope.toEdit = false;
            $scope.selectedValue = null;
            $scope.isDisabled = true;
            $scope.editVisible = true;
            $scope.lookupTypes = viewmodel.lookupTypes;
            $scope.isVisible = false;           
            $scope.lookupData = {};
            $scope.lookupData.isSubcategory = false;
            $scope.selectedType = {};

            var editLookUpData = $rootScope.editLookUpData;

            lookupAppService.getLookupTypesByProviderId(viewmodel.serviceprovider.id).then(function(lookupTypes) {
                $scope.lookupTypes = lookupTypes;
            }, function(error) {
                console.log(error.statusText);
            });

             $scope.getChildLookup = function(){
                var parentLookup=$scope.selectedType;

                lookupAppService.get(viewmodel.serviceprovider.id, parentLookup.name).then(function (data) {
                    $scope.parentlookupvalue = data;
                    // viewModel.appointment = data;
                    // viewModel.appointmentCategory = _.pluck(data, 'value');
                }, function (error) {
                    console.log(error.statusText);
                });
              
                lookupAppService.getChildLookupType(parentLookup._id,viewmodel.serviceprovider.id).then(function(childLookupType){
                    $scope.childLookupType = childLookupType;
                },function(error){
                    console.log(error.statusText);
                });                  
            };

            if (editLookUpData != undefined) {
                $scope.toEdit = true;
                $scope.isDisabled = false;
                $scope.lookupData.isSubcategory = editLookUpData[0].childlookupEnabled ? 'Yes' : 'No'; 
                $scope.isVisible = editLookUpData[0].isVisible;
                $scope.childselectedValue =  editLookUpData[0].childlookupType;
                $scope.itemId = editLookUpData[0]._id;
                $scope.selectedValue = editLookUpData[0].type;
              
                $scope.lookupData.effectiveFrom = new Date(editLookUpData[0].effectiveFrom);
                $scope.lookupData.effectiveTo = new Date(editLookUpData[0].effectiveTo);
                $scope.lookupData.lookupValue = editLookUpData[0].value;
                $scope.lookupData.description = editLookUpData[0].description;
                $scope.lookupEnabled = editLookUpData[0].isEnabled ? 'Yes' : 'No';
                $scope.parentselectedValue = $rootScope.parentselectedValue;
                $scope.editVisible = false;
            }
            
            $scope.ShowHide = function () {
                $scope.lookupData.isSubcategory ==="Yes" ? $scope.isVisible = true :$scope.isVisible = false;
            };

           

            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            $scope.answer = function(answer) {
                $mdDialog.hide(answer);
            };

            $scope.savelookupType = function() {

                $scope.lookupData.isEnabled = ($scope.lookupEnabled === 'Yes');

                if ($scope.toEdit == true) {
                    $scope.lookupData['id'] = editLookUpData[0]._id;
                    if ( $scope.lookupData.isSubcategory === ("Yes" || true)) {
                        $scope.lookupData.ChildLookUp = JSON.parse($scope.childLookupType).name;
                        $scope.lookupData.parentlookupValue = $scope.selectedParentValue.value;
                    }
                    lookupAppService.updateLookupValue(viewmodel.serviceprovider.id, $scope.selectedType.name, $scope.lookupData).then(function(data) {
                        $scope.error = true;
                        $scope.message = data.message;
                        if (data.success) {
                            $timeout(function() {
                                $scope.hide();
                            }, 1000);
                            viewmodel.updateDisplayLookUpDataGrid();
                        }
                    }, function(error) {
                        console.log(error.statusText);
                    });
                } else {

                    if ( $scope.lookupData.isSubcategory === ("Yes" || true)) {
                        $scope.lookupData.ChildLookUp = JSON.parse($scope.childLookupType).name;
                        $scope.lookupData.parentlookupValue = $scope.selectedParentValue.value;
                    }
                    if(viewmodel.serviceprovider.corporateLogin == true){
                        viewmodel.serviceprovider.id = null;
                    }
                    lookupAppService.createLookupValue(viewmodel.serviceprovider.id, $scope.selectedType.name, $scope.lookupData)
                        .then(function(data) {

                            if (data.success) {
                                $mdDialog.cancel();

                                viewmodel.updateDisplayLookUpDataGrid();
                            } else {
                                $scope.error = true;
                                $scope.message = data.message;
                            }
                        }, function(error) {
                            console.log(error.statusText);
                        });
                }
            }
        }

        viewmodel.updateDisplayLookUpDataGrid = function() {
            lookupAppService.get(viewmodel.serviceprovider.id).then(function(data) {
                viewmodel.lookupValues = data;
                displayLookupList(data);
            }, function(error) {
                console.log(error.statusText);
            });
        }

        viewmodel.getLookUpList = function() {
            if( !viewmodel.lookUpSearchBox ) {
                viewmodel.updateDisplayLookUpDataGrid();
            }
        }

        function displayLookupList(data) {
            viewmodel.DisplaylookupValue.data = []; console.log(data);
            angular.forEach(data, function(item) { 
                viewmodel.DisplaylookupValue.data.push({
                    "id": item._id,
                    "Lookup Type": item.type,
                    "Lookup Value": item.value,
                    "Description": item.description,
                    "Enabled": item.isEnabled ? 'Yes' : 'No',
                    "Effective From": item.effectiveFrom,
                    "Effective To": item.effectiveTo,
                    "serviceProviderId" :item.serviceProviderId
                });
            });
        }

        viewmodel.searchLookUp = function() {
            spAppService.gridViewSearch('lookup', viewmodel.lookUpSearchBox)
                .then(function(data) {
                    if( data.success ) {
                        displayLookupList(data.entity);
                    } else {
                        toaster.pop('Nothing found!', "", "Sorry no lookups found!");
                    }

                }, function(error) {
                    console.log(error.statusText);
                });
        }


    // }).controller('lookupTypeListController', function(lookupAppService, $mdDialog, $scope, Auth, $rootScope) {

        // viewmodel = this;
        viewmodel.DisplaylookupList = {};

        Auth.getUser()
            .success(function (data) {
                viewmodel.serviceprovider = data;

                viewmodel.displayLookupTypesGrid();
            });


        viewmodel.DisplaylookupList = {
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: 2,
            paginationPageSizes: [10, 25, 50, 75],
            paginationPageSize: 10,
            columnDefs: [{
                name: 'id',
                visible: false
            }, {
                name: 'Lookup Type',     
            }, {
                name: 'Action',
                cellTemplate: '<div class="col-lg-12"  layout="row"><button type="button" ng-show="!row.entity.inUse" style="margin-left: 5px;margin-top:5px;" ng-click="grid.appScope.l.deleteLookUpType(row.entity.id)" class="btn btn-sm btn-danger">Delete</button></div>',
                width: '130',
                enableSorting: false
            }],

            rowHeight: 50,
        };

        viewmodel.displayLookupTypesGrid = function () {
            lookupAppService.getLookupTypesByProviderId(viewmodel.serviceprovider.id).then(function (data) {

                viewmodel.DisplaylookupList.data = [];
                angular.forEach(data, function (item) {
                    viewmodel.DisplaylookupList.data.push({
                        "id": item._id,
                        "Lookup Type": item.name,
                        'inUse': item.inUse
                    });
                });
            }, function (error) {
                console.log(error.statusText);
            });
        }

        viewmodel.deleteLookUpType = function(id) {

            var confirm = $mdDialog.confirm()
                .title('Would you like to delete this LookUp Type?')
                .ariaLabel('Lucky day')
                .targetEvent(id)
                .ok('Please do it!')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                lookupAppService.deletelookUpType(id)
                    .then(function(data) {
                        if( !data.success ) 
                            toaster.pop('info', 'LookUpType is already in Use');
                        viewmodel.displayLookupTypesGrid();
                    }, function(error) {
                        console.log(error.statusText);
                    });
            }, function() {

            });

        };
      

    });
