const { ObjectID } = require("bson");
const { getDb, ACCOUNTS_COLLECTIONS, USER_FLOWCHARTS_COLLECTION } = require("../configs/db.config");
const profile = require("../configs/profile.icons");

const db = getDb();

exports.accountView = (req, res) => {
    res.render("./pages/account-profile", { user: req.session.user, icons: profile.icons });
}

exports.setData = async (req, res) => {
    if (req.session.user.major !== req.body.major) {
        const document = await db.collection(USER_FLOWCHARTS_COLLECTION).updateOne(
            { fromAccountsId: ObjectID(req.session.user._id), major: req.body.major },
            { $setOnInsert: { fromAccountsId: ObjectID(req.session.user._id), major: req.body.major, courses: [] } },
            { upsert: true });

        (document._id) ? console.log("Document inserted") : console.log("Document already exists")
    }

    if (
        req.session.user.profile_icon !== req.body.profile_icon ||
        (req.session.user.firstName + " " + req.session.user.lastName) !== req.body.name ||
        req.session.user.major !== req.body.major
    ) {
        let [first, ...last] = req.body.name.split(" "); 
        last = last.join(' ');

        const document = await db.collection(ACCOUNTS_COLLECTIONS).updateOne(
            { _id: ObjectID(req.session.user._id) },
            {$set:{
                profile_icon: req.body.profile_icon,
                firstName: first,
                lastName: last,
                major: req.body.major
            }
            });

        if (document.matchedCount) {
            console.log("Document updated")
            req.session.user.profile_icon = req.body.profile_icon;
            req.session.user.major = req.body.major;
            req.session.user.firstName = first;
            req.session.user.lastName = last;
        } else {
            console.log("Document does not exist")
        }
    }
    
    res.redirect("/account/settings");
}