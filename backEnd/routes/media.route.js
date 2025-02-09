const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const {uploadMedia} = require("../utils/cloudinary");

router.post("/upload-video",upload.single("file"), async(req,res) => {
    try {
        const result = await uploadMedia(req.file.path);
        res.status(200).json({
            success:true,
            message:"File uploaded successfully.",
            data:result
        });
        console.log(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error uploading file"})
    }
});


module.exports = router;
