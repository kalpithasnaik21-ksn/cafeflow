const db = require("../config/database");



/* ===============================
   GET ALL PRODUCTS (ADMIN VIEW)
================================ */
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Admin product fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load products"
    });
  }
};

/* ===============================
   ADD NEW PRODUCT
================================ */
exports.addProduct = async (req, res) => {
  const {
    name,
    category_id,
    description,
    image_url,
    price,
    is_veg = 1,
    is_bestseller = 0,
    is_seasonal = 0,
    is_fast = 0
  } = req.body;

  try {
    await db.query(
      `INSERT INTO products
       (name, category_id, description, image_url, price,
        is_veg, is_bestseller, is_seasonal, is_fast, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name,
        category_id,
        description,
        image_url,
        price,
        is_veg,
        is_bestseller,
        is_seasonal,
        is_fast
      ]
    );

    res.json({
      success: true,
      message: "Product added successfully"
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product"
    });
  }
};

/* ===============================
   UPDATE PRODUCT (EDIT MODAL)
================================ */
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    await db.query(
      `UPDATE products SET
        name = ?,
        price = ?,
        image_url = ?,
        is_veg = ?,
        is_bestseller = ?,
        is_seasonal = ?,
        is_fast = ?
       WHERE id = ?`,
      [
        req.body.name,
        req.body.price,
        req.body.image_url,
        req.body.is_veg,
        req.body.is_bestseller,
        req.body.is_seasonal,
        req.body.is_fast,
        productId
      ]
    );

    res.json({
      success: true,
      message: "Product updated successfully"
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
};

/* ===============================
   TOGGLE STOCK (IN / OUT)
================================ */
exports.toggleStock = async (req, res) => {
  const { id } = req.params;
  const { is_available } = req.body;

  try {
    await db.query(
      "UPDATE products SET is_available = ? WHERE id = ?",
      [is_available, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Stock update error:", err);
    res.status(500).json({ success: false });
  }
};

/* ===============================
   DELETE PRODUCT (SOFT DELETE)


/* ===============================
   DELETE PRODUCT (PERMANENT)
================================ */
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required"
    });
  }

  db.query(
    "DELETE FROM products WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Delete product error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete product"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      return res.json({
        success: true,
        message: "Product deleted permanently ✅"
      });
    }
  );
};



/* ===============================
   UPLOAD PRODUCT IMAGE
================================ */
exports.uploadProductImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image uploaded"
    });
  }

  res.json({
    success: true,
    image_url: `/images/products/${req.file.filename}`
  });
};

