import fs from "fs";
import path from "path";
import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import bcrypt from 'bcrypt';

const uploadDir = path.resolve("./public/uploads/");

export async function handleTestUser(req, res) {
  await res.send("Welcome to Dawn 2 Dusk Blog Website..");
}

const accessTokenMaxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const refreshTokenMaxAge = 240 * 60 * 60 * 1000; // 10 days in milliseconds

export const accessTokenOptions = {
  maxAge: accessTokenMaxAge,
  httpOnly: true,
  secure: false, // Must be true in production (for HTTPS)
  sameSite: "lax", // Use 'lax' for cross-site requests
  path: "/",
};

export const refreshTokenOptions = {
  maxAge: refreshTokenMaxAge,
  httpOnly: true,
  secure: false, // Must be true in production (for HTTPS)
  sameSite: "lax", // Use 'lax' for cross-site requests
  path: "/",
};

export async function generateAccessAndRefreshToken(id) {
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(401).send("No User Found for generating tokens");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generating Access and Refresh Token", error);
  }
}

export async function handleSignupNewUser(req, res) {
  const { username, email, password, role } = req.body;

  if (
    [username, email, password].some((field) => !field || field.trim() === "")
  ) {
    return res.status(400).send("All fields are required.");
  }

  try {
    const userExist = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });
    if (userExist) {
      return res
        .status(409)
        .send("User with this email or username already exists.");
    }
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

    console.log("profile picture", profilePicture);

    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      profilePicture,
      isAdmin: role && role === "admin",
    });

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      return res
        .status(500)
        .send("Something went wrong while registering the user.");
    }

    return res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).send("Internal Server Error.");
  }
}

export async function handleLoginUser(req, res) {
  const { email, password } = req.body;

  console.log("email, password", email, password);

  if (!email || !password) {
    return res.send("All fields required...");
  }
  try {
    const userExisted = await User.findOne({ email });
    if (!userExisted) {
      return res.status(404).send("No user found.");
    }

    const matchPassword = await userExisted.isPasswordCorrect(password);
    console.log("matchPasswords", matchPassword);

    if (!matchPassword) {
      return res.status(401).send("Invalid credentials.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      userExisted._id
    );

    const loggedInUser = await User.findById(userExisted._id).select(
      "-password -refreshToken"
    );
    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);
    res.status(200).send(loggedInUser);
  } catch (error) {
    res.status(500).send("Error in login user...");
  }
}

export async function handleSignOutUser(req, res) {
  console.log(req.valideUser);

  if (req.valideUser) {
    try {
      await User.findByIdAndUpdate(
        req.valideUser._id,
        {
          $unset: { refreshToken: 1 },
        },
        { new: true }
      );

      res
        .status(200)
        .cookie("accessToken", "", {
          ...accessTokenOptions,
          expires: new Date(0),
        })
        .cookie("refreshToken", "", {
          ...refreshTokenOptions,
          expires: new Date(0),
        })
        .send("SignOut Successfully...");
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).send("SignOut failed");
    }
  }
}

export async function handleCheckIsUserLoggedIn(req, res) {
  // console.log("Access", req.cookies.accessToken);
  // console.log("Refresh", req.cookies.refreshToken);
  const accessToken = req.cookies.accessToken;

  try {
    const user = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!user) return res.status(401).send("Unauthorized Request...");

    const currentUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!currentUser) return res.status(404).send("No user found!");

    res.status(200).json(currentUser);
  } catch (error) {
    res.status(500).send("Error in fetching user details...");
  }
}

export async function handleUpdateUser(req, res) {
  const { email, username, password } = req.body;
  const { id } = req.params;

  if (
    [username, email, password].some((field) => !field || field.trim() === "")
  ) {
    return res.status(400).send("All fields are required.");
  }

  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const toUpdate = await User.findById(id);

    if (!toUpdate) {
      return res.status(404).send("No user Found..");
    }

    const previousPicturePath = path.join(
      uploadDir,
      path.basename.toString(toUpdate.profilePicture)
    );

    if (toUpdate.profilePicture && fs.existsSync(previousPicturePath)) {
      fs.unlinkSync(previousPicturePath);
      console.log(`Profile picture deleted: ${previousPicturePath}`);
    } else {
      console.log("Profile picture does not exist or invalid path.");
    }

    const updateData = {
      username,
      email,
      password,
    };

    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found.");
    }

    console.log("updated", updatedUser);
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updating user:", error);
    return res.status(500).send("Internal Server Error.");
  }
}

export async function handleDeleteAccount(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).send("User ID is required.");

  if (req.valideUser) {
    try {
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).send("User not found.");
      }

      return res
        .status(200)
        .send("User account and profile picture successfully deleted.");
    } catch (error) {
      console.error("Error in deleting user:", error);
      return res.status(500).send("Internal Server Error.");
    }
  } else {
    return res.status(401).send("Unauthorized request..");
  }
}

export async function handleGetAllUsersDetails(req, res) {
  if (req.valideUser && req.valideUser.isAdmin) {
    try {
      const allUser = await User.find();

      if (!allUser || allUser.length === 0) {
        return res.status(404).send("No user found.");
      }

      return res.status(200).json({
        users: allUser,
      });
    } catch (error) {
      console.error("Error in fetching all user:", error);
      return res.status(500).send("Internal Server Error.");
    }
  } else {
    console.log("Unauthorized request..");
  }
}

export async function handleDeleteUserAccountFromDashboard(req, res) {
  if (req.valideUser && req.valideUser.isAdmin) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(403).send("Invalid request..");
    }

    try {
      const userDetails = await User.findByIdAndDelete(userId);

      if (!userDetails) {
        return res.status(404).send("No user found..");
      }

      return res.status(200).send("User account deleted successfully..");
    } catch (error) {
      console.error("Error in deleting user:", error);
      return res.status(500).send("Internal Server Error.");
    }
  } else {
    return res.status(401).send("Unauthorized request..");
  }
}

export async function handleForgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(403).send("Email is required.");
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("No user found with this email.");
    }

    const CLIENT_ID = process.env.CLIENT_ID_FOR_MAIL;
    const CLIENT_SECRET = process.env.CLIENT_SECRET_FOR_MAIL;
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN_FOR_MAIL;
    const REDIRECT_URI = "https://developers.google.com/oauthplayground";
    const MY_EMAIL = "muhammadhammadq882@gmail.com";
    const tosend = user.email;

    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const sendTestEmail = async () => {
      try {
        const ACCESS_TOKEN = await oAuth2Client.getAccessToken();

        if (!ACCESS_TOKEN.token) {
          throw new Error("Failed to retrieve access token");
        }

        const transport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: MY_EMAIL,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: ACCESS_TOKEN.token,
          },
          tls: {
            rejectUnauthorized: true,
          },
        });

        const from = MY_EMAIL;
        const subject = "Password Reset Request - Dawn 2 Dusk Blogs";
        const text = `
          <p>Dear ${user.username},</p>
          <p>We received a request to reset your password for your account associated with this email address. If you made this request, please click on the link below to reset your password:</p>
          <p><a href="http://localhost:5173/user/reset-password/${user._id}" target="_blank">Reset your password</a></p>
          <p>If you did not request a password reset, please ignore this email. Your account security is important to us, and we recommend that you do not share your account details with anyone.</p>
          <p>Thank you for choosing Dawn 2 Dusk Blogs.</p>
          <p>Best regards,<br/>The Dawn 2 Dusk Blogs Team</p>
        `;

        return new Promise((resolve, reject) => {
          transport.sendMail(
            { from, to: tosend, subject, html: text },
            (err, info) => {
              if (err) reject(err);
              else resolve(info);
            }
          );
        });
      } catch (error) {
        throw new Error(`Error while sending email: ${error.message}`);
      }
    };

    await sendTestEmail();
    res.status(200).send("Password reset email sent successfully.");
  } catch (error) {
    console.error("Error in sending forgot password email:", error);
    res.status(500).send("Error in sending forgot password email");
  }
}

export async function handleResetPassword(req, res) {
  const { password } = req.body;
  const { userId } = req.params;

  if (!password || password.length < 6) {
    return res
      .status(400)
      .send("Strong password required and must be at least 6 characters long.");
  }

  try {
    const hashedPass = await bcrypt.hash(password, 10)
    const resetPass = await User.findByIdAndUpdate(
      userId,
      { password: hashedPass },
      { new: true }
    );

    if (!resetPass) {
      return res.status(404).send("User not found.");
    }

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error in resetting password:", error);
    res.status(500).send("Internal Server Error");
  }
}
