const User = require('../models/userModel');

const getAllUser = async (req, res) => {
  try {
    const data = await User.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const data = await User.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD } = req.body;
    if (!NAMA || !USERNAME || !ROLE || !PASSWORD) {
      return res.status(400).json({ success: false, message: 'NAMA, USERNAME, ROLE, PASSWORD wajib diisi' });
    }

    const existingUser = await User.getByUsername(USERNAME);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'USERNAME sudah digunakan' });
    }

    const data = await User.create(req.body);
    res.status(201).json({ success: true, message: 'User berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const existing = await User.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    // Remove PASSWORD from update, use dedicated endpoint instead
    const { PASSWORD, ...updateData } = req.body;

    const data = await User.update(req.params.id, updateData);
    res.json({ success: true, message: 'User berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { PASSWORD } = req.body;
    if (!PASSWORD) {
      return res.status(400).json({ success: false, message: 'PASSWORD wajib diisi' });
    }

    const existing = await User.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    await User.updatePassword(req.params.id, PASSWORD);
    res.json({ success: true, message: 'Password berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { STATUS } = req.body;
    if (!STATUS) {
      return res.status(400).json({ success: false, message: 'STATUS wajib diisi' });
    }
    if (!['AKTIF', 'NONAKTIF'].includes(STATUS)) {
      return res.status(400).json({ success: false, message: 'STATUS harus AKTIF atau NONAKTIF' });
    }

    const existing = await User.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    await User.updateStatus(req.params.id, STATUS);
    res.json({ success: true, message: `User berhasil di${STATUS === 'AKTIF' ? 'aktifkan' : 'nonaktifkan'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const existing = await User.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    await User.delete(req.params.id);
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, PASSWORD } = req.body;
    if (!NAMA || !USERNAME || !PASSWORD) {
      return res.status(400).json({ success: false, message: 'NAMA, USERNAME, PASSWORD wajib diisi' });
    }

    const existingUser = await User.getByUsername(USERNAME);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'USERNAME sudah digunakan' });
    }

    const data = await User.createAdmin(req.body);
    res.status(201).json({ success: true, message: 'Akun admin berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUser, getUserById, createUser, createAdmin, updateUser, updatePassword, updateStatus, deleteUser };