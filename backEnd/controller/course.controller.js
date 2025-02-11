const Course = require("../models/course.model");
const Lecture = require("../models/lecture.model");
const {
  deleteMediaFromCloudinary,
  uploadMedia,
} = require("../utils/cloudinary");
const createCourse = async (req, res) => {
  try {
    const { courseTitle, category } = req.body;
    if (!courseTitle || !category) {
      return res.status(400).json({
        message: "Course title and category is required.",
      });
    }
    const course = await Course.create({
      courseTitle,
      category,
      creator: req.id,
    });

    return res
      .status(201)
      .json({ success: true, course, message: "Course Created Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course!",
    });
  }
};

const getPublishedCourses = async (_, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({ path: "creator", select: "name photoUrl" });
   
    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No published courses found!",
      });
    }

    return res.status(200).json({
      success: true,
      courses,
      // message: "Published courses fetched successfully!",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch published courses",
    });
  }
};

const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.id;
    const courses = await Course.find({ creator: userId });
    if (!courses) {
      return res
        .status(404)
        .json({ success: false, courses: [], message: "course not found!" });
    }
    res
      .status(201)
      .json({ success: true, message: "Course Created Successfully", courses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course!",
    });
  }
};

const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
    } = req.body;
    const thumbnail = req.file;

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }
    let courseThumbnail;
    if (thumbnail) {
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
        await deleteMediaFromCloudinary(publicId); // delete old image
      }
      // upload a thumbnail on clourdinary
      courseThumbnail = await uploadMedia(thumbnail.path);
    }

    const updateData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail: courseThumbnail?.secure_url,
    };

    course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
    });

    return res.status(200).json({
      course,
      message: "Course updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
};


const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found!"
      })
    }
    return res.status(200).json({
      course
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get course by id"
    })
  }
};

const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        message: "Lecture title is required"
      })
    };

    // Check if course exists first
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    // create lecture
    const lecture = await Lecture.create({ lectureTitle });

    // Add lecture to course
    course.lectures.push(lecture._id);
    await course.save();

    return res.status(201).json({
      lecture,
      message: "Lecture created successfully."
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Failed to create lecture",
      error: error.message
    })
  }
};

const getCourseLectures = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      })
    }
    return res.status(200).json({
      lectures: course.lectures,
      message: "Lectures fetched successfully"
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Failed to get Lecture" })

  }


};

const editLecture = async (req, res) => {
  try {
    const { lectureTitle, videoInfo, isPreviewFree } = req.body;

    const { courseId, lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!",
      });
    }

    // update lecture
    if (lectureTitle) lecture.lectureTitle = lectureTitle;
    if (videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
    if (videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
    lecture.isPreviewFree = isPreviewFree;

    await lecture.save();

    // Ensure the course still has the lecture id if it was not aleardy added;
    const course = await Course.findById(courseId);
    if (course && !course.lectures.includes(lecture._id)) {
      course.lectures.push(lecture._id);
      await course.save();
    };
    return res.status(200).json({
      lecture,
      message: "Lecture updated successfully."
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to edit lectures"
    })
  }
};

const removeLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found"
      })
    }
    // remove lecture from cloudinary
    if (lecture.publicId) {
      await deleteMediaFromCloudinary(lecture.publicId);
    }

    // remove lecture reference from course
    await Course.updateOne(
      { lecture: lectureId },
      { $pull: { lectures: lectureId } }
    )
    return res.status(200).json({
      message: "Lecture removed successfully"
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Failed to remove lecture"
    });
  }
}

const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!"
      });
    }
    return res.status(200).json({
      lecture
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get lecture by id"
    })
  }
};

// Publish unpublish course logic
const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query; // true or false
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      })
    }
    //  publish status based on publish query
    course.isPublished = publish === "true";
    await course.save();
    const status = publish === "true" ? "published" : "unpublished";
    return res.status(200).json({
      course,
      message: `Course ${status} successfully`
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({

      message: "Failed to update course status"
    })
  }
}



module.exports = {
  createCourse, getCreatorCourses, editCourse, getCourseById, createLecture, getCourseLectures,
  editLecture, removeLecture, getLectureById, publishCourse, getPublishedCourses
};
