const express = require('express');

const{
    createSafetycase,
    getAllSafetycase,
    getOneByTopic,
    getOneSafetycase,
    updateSafetycase,
    deleteOneSafetycase,
    getLatestOne,
    updateLatest,
} = require('../controllers/safetycase');

const api = express.Router();

api.route('/').get(getAllSafetycase).post(createSafetycase);
api.route('/latest').get(getLatestOne).put(updateLatest);
api.route('/:id').get(getOneSafetycase).delete(deleteOneSafetycase);
api.route('/topic/:topic').get(getOneByTopic).put(updateSafetycase);


module.exports = api;