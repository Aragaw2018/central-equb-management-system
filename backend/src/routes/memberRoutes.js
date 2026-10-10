// src/routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const {
    getOpenGroups,
    getGroupsByPlan,
    joinGroup,
    getMemberMemberships,
    getGroupDetails,
    getMemberWins,
    searchGroupMembers
} = require('../controllers/memberController');

// 1. Browsing Groups
router.get('/open-groups', getOpenGroups);
router.get('/groups-by-plan/:planId', getGroupsByPlan);
router.get('/plans/:planId/groups', getGroupsByPlan);

// 2. Joining
router.post('/join-group', joinGroup);

// 3. User Specific
router.get('/memberships/:userId', getMemberMemberships);
router.get('/wins/:userId', getMemberWins);

// 4. Group Specific
router.get('/groups/:groupId', getGroupDetails);
router.get('/groups/:groupId/members', searchGroupMembers);

module.exports = router;