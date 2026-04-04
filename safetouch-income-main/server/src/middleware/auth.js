import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ success: false, error: "Missing or invalid Authorization header" });
    }
    const decoded = verifyToken(token);
    req.userId = decoded.sub;
    req.userPhone = decoded.phone;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
