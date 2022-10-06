const courses = document.querySelectorAll(".course");
const statusButtons = document.querySelectorAll(".status-button");
const saveButton = document.getElementById("save");
const profileSettingInputs = document.getElementById("accounts-input-fields");
const profileIconChange = document.getElementById("settings-profile-icon");
const editIcon = document.getElementById("edit-icon");
const accountSubmitButton = document.getElementById("accounts-submit-button");
const changeProfileIconButton = document.getElementById("settings-profile-icon-change");
const iconPicker = document.getElementById("profile-icon-picker");
const hiddenIconInput = document.getElementById("hidden-profile-icon-input");
let courseArr = [];
let statusClass = "";
let buttonClicked = false;

// when the dom loads, populate course array with existing data
document.addEventListener("DOMContentLoaded", async (e) => {
  if (window.location.pathname == '/flowchart') {
    // create fetch request to get data
    let response = await fetch("/flowchart/getData");
    let data = await response.json();

    // clear any previous data and assign new one
    courseArr = [];
    courseArr = [...data];

    if (courses) {
      courseArr.forEach((course) => {
        let current = document.querySelector(`[data-course="${course.fromCoursebookId}"]`)
        if(current != null){
          current = current.querySelector(".fill");

          current.classList = "fill";
          current.classList.add(course.status);
        }
      })
    }
  }
  return;
});


if (saveButton) {
  // listen to the save button
  saveButton.addEventListener("click", async (e) => {
    try {
      // post the data to the database
      const response = await fetch("/flowchart/setData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: courseArr }),
      });

      // get status of the request
      const data = await response.json();
      window.location.href = "/flowchart"
    } catch {
      console.error("error occured in while sending request");
    }

    return;
  });

  // listen to main action buttons (save, planning, taken)
  statusButtons.forEach((element) => {
    element.addEventListener("click", (e) => {
      // listening to the status of the buttons
      if (statusClass != "" && element.id != statusClass) {
        let el = document.querySelector(`#${statusClass}`);
        el.classList.remove("active");
      }

      statusClass = element.id;
      element.classList.add("active");
      buttonClicked = true;
      return;
    });
  });

}

// listen to any changes made on the courses in the svg
if (courses) {
  courses.forEach((element) => {
    element.addEventListener("click", (e) => {
      if (buttonClicked) {
        // grab path with all the data
        let path = element.querySelector(".fill");
        courseArr = courseArr.filter((val) => val.fromCoursebookId !== element.dataset.course);

        // delete if the status is the same to clear the style
        if (path.classList.length > 1 && path.classList[1] === statusClass) {
          path.classList = "fill";
          return;
        }

        // create course and delete any duplicates
        let course = { fromCoursebookId: element.dataset.course, status: statusClass };

        // add different style
        path.classList = "fill";
        path.classList.add(statusClass);

        // add to array to save
        courseArr.push(course);
      } else {
        alert("Please Select one of the Status Buttons");
      }
      return;
    });
  });
}

if (editIcon) {
  editIcon.addEventListener('click', (e) => {
    changeProfileIconButton.classList.remove("hidden");
    profileSettingInputs.childNodes[1].disabled = false;
    profileSettingInputs.childNodes[3].disabled = false;
    accountSubmitButton.classList.remove("hidden");
  })

  changeProfileIconButton.addEventListener('click', (e) => {
    iconPicker.classList.toggle("hidden");
  })

  iconPicker.childNodes.forEach((icon) => {
    icon.addEventListener("click", (e) => {
      iconPicker.classList.toggle("hidden")
      hiddenIconInput.value = icon.id;
      profileIconChange.src = `/profile-icons/${icon.id}`
    })
  })
}