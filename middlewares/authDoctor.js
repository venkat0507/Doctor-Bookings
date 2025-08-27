import jwt from "jsonwebtoken";

const authDoctor = async (req, res, next) => {
  try {
    const token = req.headers.token;  // ✅ this comes from frontend

    if (!token) {
      return res.json({ success: false, message: "Not Authorized, Login Again" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.docId = decoded.id;   // ✅ attach doctor ID for next handler

    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authDoctor;
