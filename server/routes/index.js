const router = require('express').Router();
const { protect } = require('../middleware/auth');
const auth = require('../controllers/authController');
const house = require('../controllers/houseController');
const feature = require('../controllers/featureController');
const chores = require('../controllers/choresController');
const pantry = require('../controllers/pantryController');

// Public authentication routes
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', (req, res) => res.json({ message: 'Logged out.' }));
router.get('/auth/me', protect, auth.me);

// Protected routes
router.use(protect);

// House management
router.post('/houses', house.create);
router.post('/houses/join', house.join);
router.get('/houses/current', house.current);
router.get('/houses/:id/members', house.members);
router.put('/houses/current', house.update);
router.delete('/houses/current/leave', house.leave);

// Shared expenses
router.route('/expenses').get(feature.listExpenses).post(feature.addExpense);
router.route('/expenses/:id').put(feature.updateExpense).delete(feature.deleteExpense);

// Rent tracking
router.route('/rent').get(feature.getRent).post(feature.saveRent);
router.put('/rent/:id', feature.updateRent);

// Settlements
router.get('/settlements', feature.settlements);
router.put('/settlements/:id', feature.paySettlement);

// Maintenance requests (preserved via featureController)
const setMaintenance = (req, res, next) => { req.params.feature = 'maintenance'; next(); };
router.route('/maintenance').get(setMaintenance, feature.listFeature).post(setMaintenance, feature.addFeature);
router.put('/maintenance/:id', setMaintenance, feature.updateFeature);
router.route('/:feature(maintenance)').get(feature.listFeature).post(feature.addFeature);
router.put('/:feature(maintenance)/:id', feature.updateFeature);

// Smart chore rotation
router.route('/chores').get(chores.list).post(chores.create);
router.post('/chores/rotate', chores.rotate);
router.get('/chores/workload', chores.workload);
router.route('/chores/:id').put(chores.update).delete(chores.remove);

// Shared pantry & expiry tracker
router.route('/pantry').get(pantry.list).post(pantry.create);
router.post('/pantry/:id/adjust', pantry.adjust);
router.route('/pantry/:id').put(pantry.update).delete(pantry.remove);

// Notifications & dashboard
router.get('/notifications', feature.notifications);
router.put('/notifications/:id/read', feature.readNotification);
router.get('/dashboard', feature.dashboard);

module.exports = router;
