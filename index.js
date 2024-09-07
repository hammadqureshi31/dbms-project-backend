import express, { urlencoded } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import passport from "passport";
import session from "express-session";
import pkg from "passport-google-oauth20";
import { User } from "./models/userModel.js";
import {
  accessTokenOptions,
  generateAccessAndRefreshToken,
  refreshTokenOptions,
} from "./controllers/userController.js";
import helmet from 'helmet';


const app = express();
dotenv.config({
  path: "./.env",
});

const { Strategy: GoogleStrategy } = pkg;

app.use(helmet());

const allowedorigins = ["https://dawn-2-dusk-blogs-frontend.vercel.app", "https://dawn-2-dusk-blogs-backend.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedorigins.includes(origin)) {
        return callback(null, true);
      } else {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
// app.use("/uploads", express.static("public/uploads"));


app.get("/", (req, res) => {
  res.send("Dawn 2 Dusk - Blog - Website");
});


app.use("/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/comment", commentRoutes);

app.set('trust proxy', 1);
app.use(
  session({
    secret: "dawn2dusk-blog-web-backend-session",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, 
      sameSite: "none", 
      httpOnly: true, // Helps prevent cross-site scripting attacks
    },
    proxy: true, // Required for cookies to work behind proxies like Vercel
  })
);

// Passport middleware setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://dawn-2-dusk-blogs-backend.vercel.app/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        console.log("user from google", user);

        if (!user) {
          user = new User({
            username: profile.displayName,
            email: profile.emails[0].value,
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Authentication routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://dawn-2-dusk-blogs-frontend.vercel.app/user/login",
  }),
  async (req, res, next) => {
    try {
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        req.user._id
      );

      console.log("req user at tokens", req.user);
      // Set cookies
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);
      res.cookie("accessToken", accessToken, accessTokenOptions);

      res.redirect("https://dawn-2-dusk-blogs-frontend.vercel.app");
    } catch (error) {
      console.error("Error generating tokens:", error);
      res.status(500).send("Failed to generate tokens.");
    }
  }
);



mongoose
  .connect(process.env.MONGODB_STRING)
  .then(() => {
    console.log("MongoDB connected.");
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port: ${process.env.PORT}`);
    });
  }) 
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
