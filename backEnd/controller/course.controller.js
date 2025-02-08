// const { findByIdAndUpdate } = require("../models/course.model");
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


const getCourseById = async(req,res)=>{
  try {
    const {courseId} = req.params;

    const course = await Course.findById(courseId);

    if(!course){
        return res.status(404).json({
            message:"Course not found!"
        })
    }
    return res.status(200).json({
        course
    })
} catch (error) {
    console.log(error);
    return res.status(500).json({
        message:"Failed to get course by id"
    })
}
};

const createLecture = async(req,res)=>{
  try {
    const {lectureTitle} = req.body;
    const {courseId} = req.params;

    if(!lectureTitle || !courseId){
        return res.status(400).json({
            message:"Lecture title is required"
        })
    };

    // Check if course exists first
    const course = await Course.findById(courseId);
    if(!course){
        return res.status(404).json({
            message: "Course not found"
        });
    }

    // create lecture
    const lecture = await Lecture.create({lectureTitle});

    // Add lecture to course
    course.lectures.push(lecture._id);
    await course.save();

    return res.status(201).json({
        lecture,
        message:"Lecture created successfully."
    });

} catch (error) {
   console.log(error)
    return res.status(500).json({
        message:"Failed to create lecture",
        error:error.message
    })
}
};

const getCourseLectures = async(req,res)=>{
  try {
    const {courseId} = req.params;
    const course = await Course.findById(courseId).populate("lectures");
    if(!course){
        return res.status(404).json({
            message:"Course not found"
        })
    }
    return res.status(200).json({
        lectures:course.lectures,
        message:"Lectures fetched successfully"
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({message:"Failed to get Lecture"})    

  }


};

module.exports = { createCourse, getCreatorCourses, editCourse, getCourseById, createLecture, getCourseLectures };
