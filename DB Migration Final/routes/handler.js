'use strict' ;

/**
 * Module dependencies.
 */
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var path = require('path');

/**
 * Import Config, Client and Collection String for DocumentDB Connection.
 */
var config = require('../config');
var db;
MongoClient.connect(config.connectionString, function(err, database) {

    if (err) {
        console.log(err);
    }
    console.log("Connected correctly to server");
    db = database;
});

/**
 * Handler for getting all the jobs created by a particular user.
 */
function getJobsByUser(req, res, next) {

    var userId = {$not: {$eq: parseInt(req.query.userId)}};
    var active = false;
    if (req.query.flag == 'myjobs') {
        userId = parseInt(req.query.userId);
    }
    if (req.query.status == "active") {
        active = true;
    }

    var collection = db.collection('job');
    collection.find({"userId": userId, "active": active}).toArray(function(err, docs) {
        res.send(docs);
    });
    
}

/**
 * Handler for changing candidate status in a particular stage and also log in table for AUDITING.
 */
function changeCandidateStatus(req, res, next) {
    var response = {};
    db.collection('candidate').updateOne({ "_id" : req.body.candidateId , "jobs": {$elemMatch : {jobId : req.body.jobId}}}
        , { $set: { "jobs.$.status" : req.body.status,
                    "jobs.$.statusChangedBy" : req.body.statusChangedBy,
                    "jobs.$.statusInputs" : req.body.statusInputs } }, function(err, result) {
        if (result.result.nModified) {
            response.message = 'SUCCESS';
            var statusLog = {
                "jobId": req.body.jobId,
                "candidateId": req.body.candidateId,
                "stage": req.body.stage,
                "status": req.body.status,
                "statusInputs": req.body.status,
                "statusChangedBy": req.body.statusChangedBy,
                "timeStamp": req.body.timeStamp
            }
            db.collection('statuslog').insertOne(statusLog, function(err, r) {
                if (err) {
                    response.statusLogError = err;
                }
            });
        } else {
            response.message = 'FAILURE';
            response.error = 'Candidate Id ' + req.body.candidateId + ' or Job Id ' + req.body.jobId + ' not found';
        }
        res.send(response);
    });
    
}

/**
 * Handler for changing from one stage to next stage.
 */
function moveToNextStage(req, res, next) {

    var collection = db.collection('candidate');
    var response = {};
    collection.updateMany({_id : {$in : req.body.candidateId, },  jobs: {$elemMatch : {jobId : req.body.jobId, stage: req.body.assignStageFrom}}}
        , { $set: { "jobs.$.stage" : req.body.assignStageTo,
                    "jobs.$.userId" : req.body.userId,
                    "jobs.$.timestamp" : req.body.timestamp } }, function(err, result) {
            if (result.result.nModified) {
                if (result.result.nModified == req.body.candidateId.length) {
                    response.message = 'SUCCESS';
                } else {
                    response.message = 'PARTIAL';
                    response.error = 'Some of the records was not updated';
                }
                
            } else {
                response.message = 'FAILURE';
                response.error = 'Candidate Id ' + req.body.candidateId + ' or Job Id ' + req.body.jobId + ' not found';
            }
        res.send(response);
    });
    
}

/**
 * Handler to display the list of active jobs.
 */
function getActiveJobs(req, res, next) {

    var collection = db.collection('job');
    collection.find({"active": true}).toArray(function(err, docs) {
        if (err) {
            res.send(err);
        }
        res.send(docs);
    });
    
}

/**
 * Handler for changing from one stage to next stage.
 */
function moveCandidateToActiveJob(req, res, next) {

    var collection = db.collection('candidate');
    var response = {};
    collection.updateOne({ "_id" : req.body.candidateId , "jobs": {$elemMatch : {jobId : req.body.jobId}}}
        , { $set: { "jobs.$.active" : true,
                    "jobs.$.movedBy" : req.body.movedBy,
                    "jobs.$.timestamp" : req.body.timestamp } }, function(err, result) {
            if (result.result.nModified) {
                response.message = 'SUCCESS';
            } else {
                response.message = 'FAILURE';
                response.error = 'Candidate Id ' + req.body.candidateId + ' or Job Id ' + req.body.jobId + ' not found';
            }
        res.send(response);
    });
    
}

/**
 * Handler to display the list of recruiters.
 */
function getRecruiters(req, res, next) {

    var collection = db.collection('user');
    collection.find({}).toArray(function(err, docs) {
        var response = {};
        if (err) {
            res.send(err);
        }
        response.data = docs;
        res.send(response);
    });
    
}

/**
 * Handler to get the linkedin link for the candidate.
 */
function getLinkedinLink(req, res, next) {

    var collection = db.collection('candidate');
    collection.find({_id : parseInt(req.query.candidateId)}, {linkedinLink : 1}).toArray(function(err, docs) {
        var response = {};
        if (err) {
            res.send(err);
        }
        if (docs.length > 0) {
            if (docs[0].linkedinLink) {
                response.linkedinLink = docs[0].linkedinLink;
            } else {
                response.message = 'No LinkedIn Link found';
            }
        } else {
            response.message = 'Candidate with candidateId - ' + req.query.candidateId + ' not found';
        }
        res.send(response);
    });
    
}

/**
 * Handler to get details of the candidate.
 */
function getCandidateDetails(req, res, next) {

    var collection = db.collection('candidate');
    collection.find({ _id:parseInt(req.query.candidateId) }, { jobs:0 }).toArray(function(err, docs) {
        var response;
        if (err) {
            response = err;
        }
        if (docs.length > 0) {
            response = docs[0];
        } else {
            response = { message: 'Candidate with candidateId - ' + req.query.candidateId + ' not found'};
        }
        res.send(response);
    });
    
}

/**
 * Handler to update details of the candidate.
 */
function updateCandidateDetails(req, res, next) {

    var collection = db.collection('candidate');
    collection.updateOne({ "_id" : parseInt(req.query.candidateId)}
        , { $set: req.body }, function(err, result) {
            var response = {};
            if (result.result.nModified) {
                response.message = 'SUCCESS';
            } else {
                response.message = 'FAILURE';
                response.error = 'Candidate Id ' + req.body.candidateId + ' or Job Id ' + req.body.jobId + ' not found';
            }
        res.send(response);
    });
    
}

/**
 * Handler to disable a job and move the candidates to inactive job.
 */
function moveToInactiveJob(req, res, next) {

    // var collection = db.collection('candidate');
    db.collection('job').updateOne({ "_id" : req.body.jobId}
        , { $set: {active: false, reason: req.body.reason, timestamp: req.body.timestamp} }, function(err, result) {
            var response = {};
            if (result.result.nModified) {
                response.message = 'SUCCESS';
                db.collection('candidate').updateMany({jobs: {$elemMatch : {jobId : req.body.jobId}}}
                    , { $set: {"jobs.$.active": false} }, function(err, r) {
                    res.send(response);
                });
            } else {
                response.message = 'FAILURE';
                response.error = 'Job Id - ' + req.body.jobId + ' not found or is already inactive';
                res.send(response);
            }
    });
    
}

/**
 * Handler to add interview date for either SHORTLIST stage or in INTERVIEW stage.
 */
function addInterviewDate(req, res, next) {

    var collection = db.collection('candidate');
    var response = {};
    if (req.body.stage == 'SHORTLIST') {
        if (req.body.interview.round != 1 || req.body.interview.rescheduleReason != null ) {
            response.message = 'FAILURE';
            response.error = 'Invalid round or rescheduleReason for ' + req.body.stage + ' stage';
        }
    } else {
        if (req.body.interview.round <= 1) {
            response.message = 'FAILURE';
            response.error = 'Invalid round for ' + req.body.stage + ' stage';
        }
    }
    if (response.message) {
        res.send(response);
    } else {
        collection.updateMany({ _id : {$in : req.body.candidateId },  jobs: {$elemMatch : {jobId : req.body.jobId, stage: req.body.stage}}}
            , { $set: { "jobs.$.interview" : req.body.interview,
                        "jobs.$.timestamp" : req.body.timestamp } }, function(err, result) {
                if (result.result.nModified) {
                    if (result.result.nModified == req.body.candidateId.length) {
                        response.message = 'SUCCESS';
                    } else {
                        response.message = 'PARTIAL';
                        response.error = 'Some of the records was not updated';
                    }
                    
                } else {
                    response.message = 'FAILURE';
                    response.error = 'Nothing to update';
                }
            res.send(response);
        });
    }
    
    
}

/**
 * Handler to upload resume.
 */
function uploadResume(req, res, next) {

    var response = {};    
    var data = {
        "originalFileName": req.file.originalname,
        "hashFileName": req.file.filename,
        "encoding": req.file.encoding,
        "mimetype": req.file.mimetype,
        "uploadDate": req.body.uploadedDate
    };
    
    var oldPath = path.resolve("./uploads", data.hashFileName);
    var newPath = path.resolve("./uploads", data.hashFileName);
    if(data.mimetype == "application/msword"){
        newPath = newPath+".doc";
        data.hashFileName = data.hashFileName+".doc";
    } else if(data.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
        newPath = newPath+".docx";
        data.hashFileName = data.hashFileName +".docx";
    } else if(data.mimetype == "application/pdf"){
        newPath = newPath+".pdf"
        data.hashFileName = data.hashFileName +".pdf"
    }

    fs.rename(oldPath, newPath, function (err) {
        if(err){
            response.renameFileError = err;
            res.send(response);
        } else {
            data.timeStamp = new Date(req.body.uploadedDate.slice(0, 19).replace('T', ' ')).toISOString();
            var collection = db.collection('candidate');
            collection.find({ email_id: req.body.email_id, phone_no: req.body.phone_no }).toArray(function(err, docs) {
                if (err) {
                    response.updateError= err;
                }
                if (docs.length > 0) {
                    collection.updateOne({ "_id" : parseInt(docs[0]._id)}
                        , { $set: data }, function(err, result) {
                            var response = {};
                            if (result.result.nModified) {
                                response.message = 'UPDATE SUCCESS';
                            } else {
                                response.message = 'UPDATE FAILURE';
                                response.error = 'No records found';
                            }
                        res.send(response);
                    });
                } else {
                    var obj = req.body;
                    Object.assign(obj, data);
                    obj.userId = parseInt(obj.userId);
                    obj.jobId = parseInt(obj.jobId);
                    db.collection('job').find({_id: parseInt(obj.jobId)}).toArray(function(err, items) {
                        if (err) {
                            response.jobError = err;
                        }
                        if (items.length > 0) {
                            collection.count(function (err, count) {
                                if (err) {
                                    response.countError = err;
                                    res.send(response);
                                }
                                obj._id = count + 1;
                                obj.jobs = [{
                                    jobId: obj.jobId,
                                    status: 'NEW RESUME',
                                    stage: 'NEW',
                                    userId: obj.userId
                                }];
                                delete obj.jobId;
                                delete obj.userId;
                                delete obj.uploadedDate;
                                collection.insertOne(obj, function (err, r) {
                                    if (err) {
                                        response.insertError = err;
                                    }
                                    if (r.insertedCount) {
                                        response.message = 'ADD SUCCESS';
                                        response.candidateId = r.insertedId;
                                    } else {
                                        response.message = 'ADD FAILURE';
                                    }                                   
                                    res.send(response);
                                });
                            });
                        } else {
                            response.message = 'FAILURE';
                            response.error = 'Job with ID - ' + req.body.jobId + ' not found';
                        }
                    })
                }
            });
        }
    });
    
}

/**
 * Handler to get resume file for a candidate.
 */
function getResume(req, res, next) {

    var collection = db.collection('candidate');
    collection.find({ _id:parseInt(req.query.candidateId) }, { hashFileName:1 }).toArray(function(err, docs) {
        var response;
        if (err) {
            response = err;
        }
        if (docs.length > 0) {
            if (docs[0].hashFileName) {
                var pathURL = "https://docs.google.com/viewer?url="+config.appHostName+"/"+docs[0].hashFileName+"&embedded=true";
                response = { "isResumeFound": true, "pathURL": pathURL };
            } else {
                response = { "isResumeFound": false, "pathURL": null };
            }
        } else {
            response = { message: 'Candidate with candidateId - ' + req.query.candidateId + ' not found'};
        }
        res.send(response);
    });
    
}

/**
 * Handler to sort candidate by stage for job.
 */
function sortCandidateByStage(req, res, next) {

    var collection = db.collection('candidate');
    collection.aggregate([{ $unwind: "$jobs" },
        { $match: { 'jobs.jobId' : req.body.jobId}},
        { $group : { _id : "$jobs.stage", candidates: { $push: "$$ROOT" } } }], function(err, docs) {
            var response = [];
            var stages = ["NEW", "SHORTLIST", "INTERVIEW", "OFFER", "JOINED", "CANDIDATE"];
            if (req.body.filter) {                
                if (docs.length > 0) {
                    docs.map (function (item, index) {
                        if (item._id == Object.keys(req.body.filter)[0]) {
                            if (item.candidates.length > 0) {
                                var candidates = [];
                                item.candidates.map( function (itm, i) {                                    
                                    var filters = req.body.filter[Object.keys(req.body.filter)[0]];
                                    var foundRecruiter = true;
                                    var foundStatus = true;
                                    if (filters.filterByRecruiter) {
                                        if (filters.filterByRecruiter.indexOf(itm.jobs.userId) < 0) {
                                            foundRecruiter = false;
                                        }
                                    }
                                    if (filters.selectStatus) {
                                        if (itm.jobs.status != filters.selectStatus) {
                                            foundStatus = false;
                                        }
                                    }
                                    if (foundRecruiter && foundStatus) {
                                        candidates.push(itm);
                                    }
                                  });
                                  item.candidates = candidates;
                            }
                        }
                        response.push(item);
                    });
                }
            } else {
                response = docs;
            }
            stages.map( function (item, index) {
                var found = false;
                response.map ( function (itm, index) {
                    if (itm._id == item) {
                        found = true;
                    }
                });
                if (!found) {
                    response.push( {_id: item, candidates: []});
                }
            });
            res.send(response);
    });
    
}

/**
 * Handler to get candidate feed data.
 */
function getFeedData(req, res, next) {

    var collection = db.collection('candidate');
    var response = {currentFeed: [], previousFeed: []};
    collection.aggregate([{$match: {_id: parseInt(req.query.candidateId)}},
        {$unwind: "$feeds"},{$group: {_id: { jobId: "$feeds.jobId", feedType: "$feeds.feedType" },feeds: { $first: "$feeds"}}}, 
        {$group: { _id: { jobId: "$_id.jobId"},jobId: {$first: "$_id.jobId"},msgThread: { $push: {feedType: "$_id.feedType", feed: {message: "$feeds.message", sentTo: "$feeds.sentTo", sentFrom: "$feeds.sentFrom", timeStamp: "$feeds.timestamp"}}}}} 
        ], function(err, docs) {

            var jobIds = [];
            var types = ["TAGS","MAILS","STATUS","NOTES"];
            if (docs.length > 0) {
                docs.map(function (itm, i) {
                    jobIds.push(itm.jobId);
                    var msgThread = itm.msgThread;
                    types.map( function (item, index) {
                        var found = false;
                        itm.msgThread.map ( function (it, ind) {
                            if (it.feedType == item) {
                                found = true;
                            }
                        });
                        if (!found) {
                            msgThread.push( {feedType: item, feed: {}});
                        }
                    });
                    itm.msgThread = msgThread;
                });

                db.collection('job').find({ _id: {$in: jobIds}}).toArray(function(err, job) {
                    if (err) {
                        response.jobError = err;
                    }
                    if (job.length > 0) {
                        
                        docs.map(function (itm, i) {
                            job.map(function (item, index) {
                                if (item._id == itm.jobId) {
                                    Object.assign(itm, item);
                                }
                            });
                        });

                        collection.aggregate({$match: {_id: parseInt(req.query.candidateId)}}, {$unwind: "$jobs"}, {$match: {"jobs.jobId": {$in: jobIds}}}, {$project: {jobId: "$jobs.jobId", status: "$jobs.status"}}
                        , function(err, doc) {
                            var previousFeedStatus = ["DUPLICATE","SCREEN REJECT","AVAILABLE LATER","NOT INTERESTED","CANDIDATES DROPPED","INTERVIEW REJECT","NO SHOW","OFFER DENIED","OFFER REJECTED","OFFERED + DUPLICATE.","JOINED","ABSCONDING","JOB ID MOVED TO INACTIVE"];
                            var jobs = doc;
                            docs.map(function (item,index) {
                                jobs.map(function (itm,i) {
                                    var obj = item;
                                    delete obj._id;
                                    if (item.jobId == itm.jobId) {
                                        if (previousFeedStatus.indexOf(itm.status) > -1){
                                            response.previousFeed.push(obj);
                                        } else {
                                            response.currentFeed.push(obj);
                                        }
                                    }
                                });
                            });
                            res.send(response);
                        });

                    } else {
                        response = { message: 'No job found'};
                        res.send(response);
                    }
                });

                
                
            }

            
    });
    
}

// Recursive function to be used by savePostMessage()
function extractUserId(userNameArr, message) {
    var firstChar = message.charAt(0);
    if(firstChar === " "){
        return extractUserId(userNameArr, message.substr(1));
    } else if(firstChar === "@"){
        var idx = message.indexOf(" ");
        userNameArr.push(message.substr(1,idx-1));
         return extractUserId(userNameArr, message.substr(idx));
    } else {
        return {"userNames": userNameArr, "message": message};
    }
}

/**
 * Handler to save post message feed.
 */
function savePostMessage(req, res, next) {

    var collection = db.collection('candidate');
    var response = {};
    var userId = req.body.userId;
    var jobId = req.body.jobId;
    var candidateId = req.body.candidateId;
    var message = (req.body.message).trim();
    var feed = {};

    if(userId && jobId && candidateId && message && message.length !== 0){
        var obj = extractUserId([], message);

        collection.find({ _id: candidateId, jobs: {$elemMatch: {jobId: jobId}}},{"jobs.$":1}).toArray(function (err, candidates) {
            if (err) {
                res.send({candidateError: err});
            }
            if (candidates.length > 0) {
                db.collection('user').find({ _id: userId}).toArray(function (err, userDoc) {

                    if (userDoc.length > 0) {
                        feed.sentFrom = userDoc[0].emailId;
                    } 
                    db.collection('user').find({ userName : {$in: obj.userNames}}).toArray(function (err, userDocs) {
                        if (err) {
                            res.send({CurrentUserError: err});
                        }
                        feed.message = obj.message;
                        feed.jobId = jobId;
                        feed.timeStamp = new Date().toISOString().replace('T', ' ');

                        if (userDocs.length == 0) {
                            feed.feedType = "NOTE";                    
                        } else {
                            feed.feedType = "TAGS";
                            var sentTo = [];
                            userDocs.map(function (itm, i) {
                                sentTo.push(itm.emailId);
                            });
                            feed.sentTo = sentTo.join(',');                    
                        }

                        collection.updateOne({ _id: candidateId }
                            , { $push : { feeds : feed} }, function(err, result) {
                                if (err) {
                                    res.send({candidateFeedUpdateError: err});
                                }
                                if (result.result.nModified) {
                                    response.message = 'SUCCESS';                            
                                } else {
                                    response.message = 'FAILURE';
                                    response.error = 'Candidate Id ' + req.body.candidateId + ' not found';
                                }
                            res.send(response);
                        });
                    });
                });
            } else {
                res.send({message: 'FAILURE', err: 'Candidate with Id - ' + candidateId + ' or Job with Id - ' + jobId + ' not found'});
            }
        })
    } else {
        res.send({"message": "BAD REQUEST"});
    }
    
}

/**
 * Handler to get similar jobs for a resume.
 */
function getSimilarJobs(req, res, next) {

    var collection = db.collection('job');
    var response;
    // var primarySkill = /^+req.body.primarySkill+$/i;
    db.collection('candidate').find({ _id: req.body.candidateId }, {"jobs.jobId": 1}).toArray(function (err, candidates) {
        if (err) {
            res.send({candidateJobError: err});
        }
        var jobArray = [];
        if (candidates.length > 0) {
            if (candidates[0].jobs) {
                if (candidates[0].jobs.length > 0) {
                    candidates[0].jobs.map(function (itm,i) {
                        jobArray.push(itm.jobId);
                    });
                }
            }
        }
        collection.find({ primarySkill: req.body.primarySkill.toUpperCase(), maxCtc: {$gt: req.body.maxCtc}, maxExp: {$gt:req.body.maxExp},
                    minExp: {$lt: req.body.minExp}, designation: req.body.designation, _id: {$nin: jobArray}}).toArray(function(err, jobDocs) {
            if (err) {
                response = err;
            }
            response = jobDocs;
            res.send(response);
        });
    })
    
}


exports.getJobsByUser = getJobsByUser;
exports.changeCandidateStatus = changeCandidateStatus;
exports.moveToNextStage = moveToNextStage;
exports.getActiveJobs = getActiveJobs;
exports.moveCandidateToActiveJob = moveCandidateToActiveJob;
exports.getRecruiters = getRecruiters;
exports.getLinkedinLink = getLinkedinLink;
exports.getCandidateDetails = getCandidateDetails;
exports.updateCandidateDetails = updateCandidateDetails;
exports.moveToInactiveJob = moveToInactiveJob;
exports.addInterviewDate = addInterviewDate;
exports.uploadResume = uploadResume;
exports.getResume = getResume;
exports.sortCandidateByStage = sortCandidateByStage;
exports.getFeedData = getFeedData;
exports.savePostMessage = savePostMessage;
exports.getSimilarJobs = getSimilarJobs;