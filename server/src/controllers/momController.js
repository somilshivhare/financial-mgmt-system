const { apiSuccess } = require('../utils/apiResponse');
const momService = require('../services/momService');

const listMeetings = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await momService.listMeetings({ page, pageSize });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const meeting = await momService.createMeeting(req.body, req.user.id);
    res.status(201).json(apiSuccess(meeting, 'Meeting created'));
  } catch (err) {
    next(err);
  }
};

const listMinutes = async (req, res, next) => {
  try {
    const minutes = await momService.listMinutes(req.params.id);
    res.json(apiSuccess(minutes));
  } catch (err) {
    next(err);
  }
};

const addMinute = async (req, res, next) => {
  try {
    const minute = await momService.addMinute(req.params.id, req.body, req.user.id);
    res.status(201).json(apiSuccess(minute, 'MoM item added'));
  } catch (err) {
    next(err);
  }
};

module.exports = { listMeetings, createMeeting, listMinutes, addMinute };

