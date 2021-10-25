// init
const db = require("../database");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const passport = require("passport");
require("../utils/passportConfig")(passport);
const User = db.User;

// get all users
exports.getAll = async (req, res) => {
  try {
    //   getting all users from user cellection
    let users = await User.find();
    // sending user in response
    res.json({ users });
  } catch (err) {
    console.log("Error --------> ", err);
    //   sending error in response
    res.status(500).json(err);
  }
};

// register user
exports.register = async (req, res) => {
  try {
    //   checking if email already exist
    if (await User.findOne({ email: req.body.email })) {
      throw 'Email "' + req.body.email + '" is already taken';
    }

    // checking for picture
    if (req.file) {
      req.body = { ...req.body, picture: req.file.path };
    }
    // intializing user object
    const user = new User(req.body);

    // hashing password
    user.password = bcrypt.hashSync(req.body.password, 10);

    //   saving user
    await user.save();
    // sending error in response with status code of 200
    res.json({ user });
  } catch (err) {
    console.log("Error --------> ", err);
    // sending error in response
    res.status(500).json(err);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    // authentication with passport
    passport.authenticate("local", (err, user, info) => {
      // checking for error
      if (err) throw err;
      // checking for user
      if (!user) {
        res.status(401).json(info.message);
      } else {
        // Logging user in and sending in response
        req.logIn(user, (err) => {
          if (err) throw err;
          res.send(user);
        });
      }
    })(req, res, next);
  } catch (err) {
    console.log("Error --------> ", err);
    res.status(500).json(err);
  }
};

// sending the logged in user in response
exports.loggedIn = async (req, res) => {
  res.json({ user: req.user });
};

// logout user
exports.logout = async (req, res) => {
  try {
    req.logOut();
    res.status(200).send("Logout successfully");
  } catch (err) {
    console.log("Error --------> ", err);
    res.status(500).json(err);
  }
};

// forget password
exports.forgetPassword = async (req, res) => {
  try {
    // getting user by email
    let user = await User.findOne({ email: req.body.email });
    // checking if user exist
    if (user === null) {
      res.status(404).json("User not found!");
    }
    // generating new random password
    let newPassword = "";
    var chars =
      "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = 0; i <= 8; i++) {
      var randomNumber = Math.floor(Math.random() * chars.length);
      newPassword += chars.substring(randomNumber, randomNumber + 1);
    }
    // saving the random password in user
    user.password = bcrypt.hashSync(newPassword, 10);
    User.findByIdAndUpdate(user._id, user)
      .then(async () => {
        // email template
        const html = `
    <body style="margin: 0; padding: 0">
      <table role="presentation" style="
                width: 100%;
                border-collapse: collapse;
                border: 0;
                border-spacing: 0;
                background: #ffffff;
              ">
          <tr>
              <td align="center" style="padding: 0">
                  <table role="presentation" style="
                      width: 602px;
                      border-collapse: collapse;
                      border: 1px solid #cccccc;
                      border-spacing: 0;
                      text-align: left;
                    ">
                      <tr>
                          <td align="center" style="padding: 20px 5px 10px 5px; background: rgb(255, 255, 255)">
                              <img src="https://icon-library.com/images/reset-password-icon/reset-password-icon-29.jpg" alt="" width="150"
                                  style="height: auto; display: block" />
                              <h2 style="font-family: Gadugi">Hi ${user.firstname} ${user.lastname},</h2>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 20px 10px 20px 10px;background: rgba(184, 183, 183, 0.651);">
                              <h3 style="font-family: Monospace; font-size: 25px;">
                                  Your new Password is below:
                              </h3>
                              <p style="font-family: monospace;
                              font-weight: bold;
                              background-color: rgb(255, 255, 255);
                              border: none;
                              color: rgb(0, 0, 0);
                              padding: 15px 32px;
                              text-align: center;
                              text-decoration: none;
                              display: inline-block;
                              font-size: 20px;">${newPassword}</p>
                              <h3 style="font-family: Monospace; font-size: 15px;">
                                  You can use this password to log into your account.
                              </h3>
                          </td>
                      </tr>
                      <tr>
                          <td style="padding: 10px 10px 10px 10px; background: #ee4c50">
                              <p style="color: white; font-family: Helvetica;">Address: Falcon IT Consulting</p>
                              <p style="color: white; font-family: Helvetica;">
                                  Call: 
                                  <a style="color: white; font-family: Helvetica;" href="tel:+610862050609">090078601</a>
                              </p>
                              <p style="color: white; font-family: Helvetica;">Email:
                                  <a style="color: white; font-family: Helvetica;" href="mailto:admin@falconit.com">admin@falconit.com</a>
                              </p>
                          </td>
                      </tr>
                      <tr>
                        <td>
                          <p align="center" style="color: #6b6b6b; font-family: Helvetica;">This email is generated automatically please do not reply.</p>
                        </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
    `;
        // email transporter
        var transporter = nodemailer.createTransport({
          service: "gmail",
          port: "465",
          secure: true,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
          },
        });
        // sending mail
        transporter.sendMail(
          {
            from: process.env.EMAIL,
            to: user.email,
            subject: "Password Reset Email",
            html: html,
          },
          function (err, info) {
            if (err) {
              console.log(err.message);
              // returning error
              res.status(500).json(err);
            } else {
              // returning success message
              res.status(200).json({
                msg: "Password Update Email sent.",
              });
            }
          }
        );
      })
      .catch((err) => res.status(500).json(err));
  } catch (err) {
    console.log("Error --------> ", err);
    res.status(500).json(err);
  }
};
