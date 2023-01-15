const {
    getDb,
    ACCOUNTS_COLLECTIONS,
    USER_FLOWCHARTS_COLLECTION,
} = require("../configs/db.config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = getDb();
const nodemailer = require("nodemailer");
const profile = require("../configs/profile.icons");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "fernando.jport@gmail.com",
        pass: process.env.SUPPORT_EMAIL_PASS,
    },
});

var mailOptions = {
    from: "fernando.jport.dev@gmail.com",
    to: "",
    subject: "Please verify your email for UTD Flowchart Tracker",
    text: "",
};

let collection;
let tempEmailForVerification = "";
let tempFirstName = "";

exports.signInView = (req, res) => {
    res.status(200).render("./pages/sign-in");
};

exports.signIn = async (req, res) => {
    let user = await db
        .collection(ACCOUNTS_COLLECTIONS)
        .findOne({ email: req.body.email });

    if (!user) {
        return res.status(400).render("./pages/sign-in", {
            message: "We couldn't find an account with that email address.",
            color: "error",
        });
    }

    bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (result == false) {
            return res.status(400).render("./pages/sign-in", {
                message: "Email or Password was incorrect. Try again.",
                color: "error",
            });
        }

        if (user.isActive == false) {
            if (req.body.email != "" && req.body.email != null) {
                tempEmailForVerification = user.email;
                tempFirstName = `${user.firtName}`;
            }

            return res.status(400).render("./pages/sign-in", {
                message: "Please verify your email adress to continue.",
                color: "warning",
                verify: true,
            });
        }

        req.session.user = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            major: user.major,
            profile_icon: user.profile_icon
        };

        return res.redirect("/flowchart");
    });
};

exports.createAccountView = (req, res) => {
    res.status(200).render("./pages/create-account");
};

exports.createAccount = async (req, res) => {
    let user = await db
        .collection(ACCOUNTS_COLLECTIONS)
        .findOne({ email: req.body.email });
    if (user) {
        return res.status(400).render("./pages/create-account", {
            message:
                "An account already exist with that email. Please enter a different email.",
            color: "error",
        });
    }

    user = req.body;
    try {
        bcrypt.hash(user.password, 10).then(async (hashedPassword) => {
            // set up user
            user.password = hashedPassword;
            user.isActive = false;
            user.profile_icon = profile.icons[Math.floor(Math.random() * (50 + 1))];
            user.hashedConfirmation = await jwt.sign(
                { email: user.email, date: Date.now() },
                process.env.AUTHENTICATION_SECRET_KEY,
                { expiresIn: "6h" }
            );

            let insertedDocument = await db
                .collection(ACCOUNTS_COLLECTIONS)
                .insertOne(user);

            await db
                .collection(USER_FLOWCHARTS_COLLECTION)
                .insertOne({
                    fromAccountsId: insertedDocument.insertedId,
                    major: user.major,
                    courses: [],
                });
            let link =
                "\nhttp://" +
                req.headers.host +
                "/auth/verify/" +
                user.hashedConfirmation;

            mailOptions.text = `Hi ${user.firstName},\nThanks for getting started with UTD Flowchart Tracker!\n\nYou registered an account but, before being able\nto use your account you need to verify that this is your email\naddress by clicking here:${link}\n\nIf you have problems, please paste the above URL into your web browser.\n\nKind Regards,\nFernando Portillo`;
            mailOptions.to = user.email;

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log(err);
                }
            });

            return res.status(200).render("./pages/sign-in", {
                message:
                    "Thanks for joining! Please verify your email address to sign in! 🎊",
                color: "success",
            });
        });
    } catch (err) {
        return res.status(400).render("./pages/create-account", {
            message:
                "Oops! Something went wrong. Try to login or create an account again. 😥",
            color: "error",
        });
    }
};

exports.forgotPasswordView = (req, res) => {
    res.status(200).render("./pages/forgot-password");
}

exports.sendResetPasswordLink = async (req, res) => {
    let user = await db.collection(ACCOUNTS_COLLECTIONS).findOne({ "email": req.body.email });

    if (!user) {
        res.status(400).render("./pages/forgot-password",
            {
                message: "We couldn't find an account with that email address.",
                color: "error",
            });
        return;
    }

    try {
        let hashedResetPasswordToken = await jwt.sign(
            { email: user.email, date: Date.now() },
            process.env.AUTHENTICATION_SECRET_KEY,
            { expiresIn: 60*30 }
        );

        let link =
            "\nhttp://" +
            req.headers.host +
            "/auth/reset-password/" +
            hashedResetPasswordToken;

        mailOptions.subject = "Reset Password Link";
        mailOptions.text = `Hi ${user.firstName},\nYou have requested to reset your password. If this was not you, please ignore this or email us back.\n\nUse the following link to reset your password.\nIt will expires in the next 30 minutes.\n${link}\n\nIf you have problems, please paste the above URL into your web browser.\n\nKind Regards,\nFernando Portillo`;
        mailOptions.to = user.email;

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                res.status(400).render("./pages/forgot-password",
                {
                    message: "Something went wrong while sending the request. Please try again or check your email!",
                    color: "error",
                });
                return;
            }
        });

        res.status(200).render("./pages/forgot-password",
        {
            message: "We have send an email with a link to reset your password.",
            color: "success",
        });

    } catch (error) {
        console.log(error);
        res.status(400).render("./pages/forgot-password",
            {
                message: "Something went wrong while sending the request. Please try again or check your email!",
                color: "error",
            });
    }

}

exports.handleResetPasswordLink = (req, res) => {
    jwt.verify(req.params.token,process.env.AUTHENTICATION_SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.status(404).send("expired");
        }
        res.status(200).render("./pages/reset-password", {token: req.params.token});
    })
}

exports.updatePassword = (req, res) => {
    if(req.body.password !== req.body.dummyPassword){
        return res.status(400).render("./pages/reset-password", {
            message: "Passwords do not match. Re-enter the new password.",
            color: "warning",
            token: req.params.token
        });
    }

    jwt.verify(req.params.token, process.env.AUTHENTICATION_SECRET_KEY, (err, decoded) => {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            let updatedDocument = await db.collection(ACCOUNTS_COLLECTIONS).updateOne(
                {email : decoded.email},
                {$set: {"password": hashedPassword}}
            );

            if(updatedDocument.modifiedCount == 0){
                return res.status(400).render("./pages/reset-password", {
                    message: "Failed to update password. Try again or contact us.",
                    color: "error",
                });
            }

            return res.status(200).render("./pages/reset-password", {
                message: "Password has been successfully updated!",
                color: "success",
            });
        })
    })    
}

exports.signOut = (req, res) => {
    console.log("sign out");
    req.session.destroy();
    res.redirect("/auth/sign-in");
};

exports.verifyEmail = (req, res) => {
    jwt.verify(req.params.token, process.env.AUTHENTICATION_SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.send("expired");
        }

        let user = await db
            .collection(ACCOUNTS_COLLECTIONS)
            .findOne({ email: decoded.email });

        if (!user) {
            return res.send("No such person");
        }

        if ((user.hashedConfirmation == req.params.token)) {
            await db.collection(ACCOUNTS_COLLECTIONS).findOneAndUpdate(
                { email: decoded.email },
                {
                    $set: {
                        isActive: true,
                    },
                    $unset: {
                        hashedConfirmation: "",
                    },
                }
            );
        } else {
            return res.send("Wrong verification email")
        }

        return res.send("Email has been verified");
    });
};

exports.resendVerification = async (req, res) => {
    try {
        // set up user
        let hashedConfirmation = await jwt.sign(
            { email: tempEmailForVerification, date: Date.now() },
            process.env.AUTHENTICATION_SECRET_KEY,
            { expiresIn: "6h" }
        );

        await db.collection(USER_FLOWCHARTS_COLLECTION).findOneAndUpdate(
            {
                email: tempEmailForVerification,
            },
            {
                $set: {
                    hashedConfirmation: hashedConfirmation,
                },
            }
        );

        let link =
            "\nhttp://" +
            req.headers.host +
            "/auth/verify/" +
            hashedConfirmation;

        mailOptions.text = `Hi,\nThanks for getting started with UTD Flowchart Tracker!\n\nYou registered an account but, before being able\nto use your account you need to verify that this is your email\naddress by clicking here:${link}\n\nIf you have problems, please paste the above URL into your web browser.\n\nKind Regards,\nFernando Portillo`;
        mailOptions.to = tempEmailForVerification;

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(200).render("./pages/sign-in", {
                    message: `Please try to login again so save your email address then hit "Resend verfication".`,
                    color: "warning",
                });
            }
        });

        return res.status(200).render("./pages/sign-in", {
            message: "Please verify your email address to sign in! 🎊",
            color: "success",
        });
    } catch (err) {
        return res.status(400).render("./pages/sign-in", {
            message:
                "Oops! Something went wrong. Try again to resend verification or login.😥",
            color: "error",
        });
    }
};