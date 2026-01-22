const { apiSuccess } = require('../utils/apiResponse');
const momService = require('../services/momService');

const listMeetings = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, meetingType, dateFrom, dateTo } = req.query;
    const result = await momService.listMeetings({ page, pageSize, status, meetingType, dateFrom, dateTo });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getMeetingById = async (req, res, next) => {
  try {
    const meeting = await momService.getMeetingById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json(apiSuccess(meeting));
  } catch (err) {
    next(err);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const meeting = await momService.createMeeting(req.body, req.user.id);
    res.status(201).json(apiSuccess(meeting, 'Meeting created successfully'));
  } catch (err) {
    next(err);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await momService.updateMeeting(req.params.id, req.body, req.user.id);
    res.json(apiSuccess(meeting, 'Meeting updated successfully'));
  } catch (err) {
    next(err);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    await momService.deleteMeeting(req.params.id);
    res.json(apiSuccess(null, 'Meeting deleted successfully'));
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
    res.status(201).json(apiSuccess(minute, 'MoM item added successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  listMeetings, 
  getMeetingById,
  createMeeting, 
  updateMeeting,
  deleteMeeting,
  listMinutes, 
  addMinute 
};
