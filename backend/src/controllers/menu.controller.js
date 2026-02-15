const db = require("../config/database");

/* ===============================
   GET ALL PRODUCTS (CUSTOMER MENU)
   - Shows ALL products
   - Frontend decides Out of Stock UI
================================ */
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.price,
        p.is_available,
        p.is_veg,
        p.is_bestseller,
        p.is_seasonal,
        p.is_fast,
        p.category_id,
        c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Menu fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load menu"
    });
  }
};

/* ===============================
   GET PRODUCTS BY CATEGORY
   - Still shows out-of-stock items
================================ */
exports.getProductsByCategory = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.price,
        p.is_available,
        p.is_veg,
        p.is_bestseller,
        p.is_seasonal,
        p.is_fast,
        p.category_id
      FROM products p
      WHERE p.category_id = ?
      ORDER BY p.created_at DESC
      `,
      [categoryId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Category menu error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load category products"
    });
  }
};
