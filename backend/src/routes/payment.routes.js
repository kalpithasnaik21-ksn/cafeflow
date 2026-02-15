const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");

router.get("/upi-qr", async (req, res) => {
  try {
    const amount = req.query.amount;

    const upiLink =
      `upi://pay?pa=cafeflow@upi&pn=CafeFlow&am=${amount}&cu=INR`;

    const qrImage = await QRCode.toDataURL(upiLink);

    res.json({
      success: true,
      qr: qrImage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
