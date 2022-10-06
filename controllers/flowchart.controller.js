const { ObjectID } = require("bson");
const { getDb, USER_FLOWCHARTS_COLLECTION } = require("../configs/db.config");

// holds current collection needed
let collection;
let db = getDb();
let message = null;

/**
 * view
 *
 * Function that renders the flowchart page. Makes a query to the database to
 * fetch the information needed to render the course information tables and flowchart.
 * Aggregates courses ObjectIDs found in users flowchart.
 *
 * @param {*} req
 * @param {*} res
 */
exports.view = async (req, res) => {
  collection = db.collection(USER_FLOWCHARTS_COLLECTION);

  // combines fields in coursebook and add to each course contaning each course information
  const data = await collection
    .aggregate([
      {
        $match: {
          fromAccountsId: ObjectID(req.session.user._id),
          major: req.session.user.major
        },
      },
      {
        $unwind: {
          path: "$courses",
        },
      },
      {
        $lookup: {
          from: "coursebook",
          localField: "courses.fromCoursebookId",
          foreignField: "_id",
          as: "courses.information",
        },
      },
      {
        $unwind: {
          path: "$courses.information",
        },
      },
      {
        $group: {
          _id: "$_id",
          courses: {
            $push: "$courses",
          },
          fromAccountsId: {
            $first: "$fromAccountsId",
          },
        },
      },
    ])
    .toArray();

  let courses;
  let course_information;
  let takenCourses;
  let planningCourses;
  let currentlyCourses;
  let takenTotalCredits;
  let planningTotalCredits;
  let currentlyTotalCredits;

  if (data.length != 0) {
    // breakdown data coming through
    courses = data[0].courses;
    course_information = [];

    // break down status into groups (yes there is a better way)
    takenCourses = courses.filter((course) => course.status === "taken")
    planningCourses = courses.filter((course) => course.status === "planning")
    currentlyCourses = courses.filter((course) => course.status === "currently")

    // break down credit hours into groups (yes there is a better way)
    takenTotalCredits = takenCourses.reduce((sum, val) => sum + val.information.credit_hours, 0);
    planningTotalCredits = planningCourses.reduce((sum, val) => sum + val.information.credit_hours, 0);
    currentlyTotalCredits = currentlyCourses.reduce((sum, val) => sum + val.information.credit_hours, 0);
  }

  // console.log(data);
  res.status(200).render("./pages/flowchart", {
    user: req.session.user,
    courses: courses || [],
    takenCourses: takenCourses || [],
    planningCourses: planningCourses || [],
    currentlyCourses: currentlyCourses || [],
    message: message,
    totalCreditHours: { taken: takenTotalCredits || 0, planning: planningTotalCredits || 0, currently: currentlyTotalCredits || 0 }
  });

  message = null;
};

/**
 * getSimplifiedFlowchartData
 *
 * Function to handle "flowchart/getData" route that gets called everytime the document loads.
 * Sends back the base information store in the flowchart database and does not aggregate courses ObjectID.
 *
 * @param {*} req
 * @param {*} res
 */
exports.getSimplifiedFlowchartData = async (req, res) => {
  collection = db.collection(USER_FLOWCHARTS_COLLECTION);
  const data = await collection.findOne({ fromAccountsId: ObjectID(req.session.user._id), major: req.session.user.major});

  if(data.length == 0){
    data.courses = [];
  }
  res.status(200).json(data.courses);
};

/**
 * setFlowchartData
 *
 * Function that handles "flowchart/setData" route that gets called each time user saves the current changes on the website.
 * Sends the data into the database by overwritting the courses field. Data coming in should be in format of
 * {id: ObjectID, statusClass: String}.
 *
 * @param {*} req
 * @param {*} res
 */
exports.setFlowchartData = async (req, res) => {
  collection = db.collection(USER_FLOWCHARTS_COLLECTION);

  req.body.data.forEach((element) => {
    element.fromCoursebookId = ObjectID(element.fromCoursebookId);
  })

  try {
    const result = await collection.findOneAndUpdate(
      { 
        fromAccountsId: ObjectID(req.session.user._id),
        major: req.session.user.major
      },
      {
        $set: {
          courses: req.body.data,
        },
      }
    );

    message = { err: false, description: "Saved Succesfully!🙌", color: "#198754" }
    res.status(200).json("Good");
  } catch (err) {
    console.log(err);
    message = { err: true, description: "Something went wrong.😥 Try to refresh the window.", color: "#B63C5A" }
    res.status(404).json("Something went wrong");
  }
};
