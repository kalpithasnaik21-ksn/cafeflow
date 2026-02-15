module.exports = function requireStaff(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  const role = req.session.user.role;

  if (role !== "staff" && role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Staff access required"
    });
  }

  next();
};
