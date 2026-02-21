const express = require('express');
const router = express.Router();
const {
  getAllUser,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  updateStatus,
  deleteUser,
  createAdmin,
} = require('../controllers/userController');

router.get('/get-all', getAllUser);
router.get('/get/:id', getUserById);
router.post('/create', createUser);
router.put('/update/:id', updateUser);
router.put('/update-password/:id', updatePassword);
router.put('/update-status/:id', updateStatus);
router.delete('/delete/:id', deleteUser);
router.post('/create-admin', createAdmin); 

module.exports = router;