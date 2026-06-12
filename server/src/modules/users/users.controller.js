const usersService = require("./users.service");
const ApiResponse = require("../../utils/ApiResponse");

const getProfile = async (req, res, next) => {
  try {
    const profile = await usersService.getProfileByUsername(
      req.params.username,
      req.user.id,
    );
    return ApiResponse.success(res, "Profile loaded", profile);
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await usersService.updateProfile(
      req.user.id,
      req.body,
      req.file,
    );
    return ApiResponse.success(res, "Profile updated", profile);
  } catch (error) {
    next(error);
  }
};

const removeMyAvatar = async (req, res, next) => {
  try {
    await usersService.removeAvatar(req.user.id);
    return ApiResponse.success(res, "Avatar removed");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateMyProfile,
  removeMyAvatar,
};
