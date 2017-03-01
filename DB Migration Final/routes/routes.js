/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();
var multer  = require('multer');
var path = require('path');
let fileFilter = function (req, file, callback) {
    let ext = path.extname(file.originalname);
    if(ext !== '.doc' && ext !== '.docx' && ext !== '.pdf') {
        return callback( new Error('File type is not accepted!') );
    }
    callback(null, true);
};
let maxFileSize = {
    fileSize: 5*1024*1024
};
var upload = multer({ dest: 'uploads/', fileFilter : fileFilter, limits: maxFileSize});

/**
 * Import Handler Object containing business logics.
 */
var Handler = require('./handler');

/**
 * Define all the necessary routes.
 */
router.get('/api/getJobsDetail', Handler.getJobsByUser);

router.post('/api/changeStatus', Handler.changeCandidateStatus);

router.post('/api/moveToNextStage', Handler.moveToNextStage);

router.get('/api/getAllActiveJobs', Handler.getActiveJobs);

router.post('/api/moveToActiveJob', Handler.moveCandidateToActiveJob);

router.get('/api/allRecruiters', Handler.getRecruiters);

router.get('/api/linkedinLink', Handler.getLinkedinLink);

router.get('/api/candidateDetails', Handler.getCandidateDetails);

router.post('/api/updateCandidateDetails', Handler.updateCandidateDetails);

router.post('/api/moveToInactiveJob', Handler.moveToInactiveJob);

router.post('/api/addInterviewDate', Handler.addInterviewDate);

router.post('/api/uploadResume', upload.single('resumeFile'), Handler.uploadResume);

router.get('/api/getResume', Handler.getResume);

router.post('/api/candidateDetailsForJob', Handler.sortCandidateByStage);

router.get('/api/feedData', Handler.getFeedData);

router.post('/api/savePostMessage', Handler.savePostMessage);

router.post('/api/getSimilarJobs', Handler.getSimilarJobs);

/**
 * Export Routes Object
 */
module.exports = router;