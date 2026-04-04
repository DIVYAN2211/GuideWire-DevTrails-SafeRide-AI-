import { Router } from "express";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { signToken } from "../utils/jwt.js";
import { HttpError } from "../middleware/errorHandler.js";
import { parseClientLocation } from "../utils/weatherLocation.js";

const router = Router();

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return null;
  return last10;
}

function randomOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Include OTP in JSON for local/dev (no SMS). Set SHOW_DEV_OTP=true if NODE_ENV=production locally. */
function devOtpPayload(code) {
  const allow =
    process.env.NODE_ENV !== "production" || process.env.SHOW_DEV_OTP === "true";
  return allow ? { devOtp: code } : {};
}

/** Signup: new user only + OTP (simulated SMS). Existing phone → 409. */
router.post("/signup", async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim() || "Rider";
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      throw new HttpError(400, "Valid 10-digit phone required");
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      throw new HttpError(
        409,
        "This phone number is already registered. Please use Login to sign in."
      );
    }

    try {
      await User.create({ phone, name });
    } catch (e) {
      if (e?.code === 11000) {
        throw new HttpError(
          409,
          "This phone number is already registered. Please use Login to sign in."
        );
      }
      throw e;
    }

    const code = randomOtp();
    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({
      success: true,
      message: "OTP sent (simulated). Use POST /api/auth/verify with this code in dev logs if needed.",
      ...devOtpPayload(code),
    });
  } catch (e) {
    next(e);
  }
});

/** Login: send OTP only if user exists */
router.post("/login/send-otp", async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      throw new HttpError(400, "Valid 10-digit phone required");
    }

    const user = await User.findOne({ phone });
    if (!user) {
      throw new HttpError(404, "No account for this phone. Sign up first.");
    }

    const code = randomOtp();
    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({
      success: true,
      message: "OTP sent (simulated).",
      ...devOtpPayload(code),
    });
  } catch (e) {
    next(e);
  }
});

/** Verify OTP → JWT */
router.post("/verify", async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").replace(/\D/g, "");
    if (!phone || otp.length !== 4) {
      throw new HttpError(400, "Phone and 4-digit OTP required");
    }

    const record = await Otp.findOne({ phone }).sort({ createdAt: -1 });
    if (!record || record.code !== otp) {
      throw new HttpError(400, "Invalid OTP");
    }
    if (record.expiresAt < new Date()) {
      throw new HttpError(400, "OTP expired");
    }

    await Otp.deleteMany({ phone });

    let user = await User.findOne({ phone });
    if (!user) {
      const name = (req.body.name || "").trim() || "Rider";
      user = await User.create({ phone, name });
    } else if (req.body.name) {
      user.name = String(req.body.name).trim() || user.name;
      await user.save();
    }

    const loc = parseClientLocation(req.body);
    if (loc) {
      user.latitude = loc.lat;
      user.longitude = loc.lon;
      user.locationUpdatedAt = new Date();
      await user.save();
    }

    const token = signToken({ sub: user._id.toString(), phone: user.phone });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
