module.exports = (req, res, next) => {
  console.log("SESSION:", req.session);
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }
  next();
};
