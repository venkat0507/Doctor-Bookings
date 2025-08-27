import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'


// API to register user

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" })
            
        }
        //validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "enter a valid Email" })       
        }
        //validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "enter a Strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        
        const userData = {
            name,
            email,
            password : hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        
        res.json({success:true,token})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//API for user login

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        
        if (!user) {
            return res.json({success:false,message:'User does not exist'})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
            
        } else {
            res.json({ success: false, message: "Invalid credentials" })
            
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//API to get user profile data

const getProfile = async (req, res) => {
    try {
        const userId = req.userId   // ✅ get from middleware, not req.body
        const userData = await userModel.findById(userId).select('-password')
        res.json({success:true,userData})


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//API to update user profile

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;  // ✅ from middleware, not req.body
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    // Parse address safely
    let parsedAddress = address;
    if (typeof address === "string") {
      parsedAddress = JSON.parse(address);
    }

    // ✅ update user profile
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: parsedAddress,
      dob,
      gender,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to book appointment

const bookAppointment = async (req, res) => {
  try {
    // ✅ take userId from middleware, not body
    const userId = req.userId;
    const { docId, slotDate, slotTime } = req.body;

    const docData = await doctorModel.findById(docId).select('-password');

    if (!docData.available) {
      return res.json({ success: false, message: "doctor not available" });
    }

    let slots_booked = { ...docData.slots_booked };

    //checking for slot availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [slotTime];
    }

    const userData = await userModel.findById(userId).select('-password');

    const docObj = docData.toObject();
    delete docObj.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: docObj,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now()
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'appointment booked', appointmentId: newAppointment._id });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const userId = req.userId;   // get from middleware

    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.json({ success: false, message: "appointmentId required" });
    }

    // ✅ Find the appointment only by ID
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Release doctor's slot
    const doctor = await doctorModel.findById(appointment.docId);
    if (doctor) {
      let slots_booked = doctor.slots_booked || {};
      if (slots_booked[appointment.slotDate]) {
        slots_booked[appointment.slotDate] = slots_booked[appointment.slotDate].filter(
          (time) => time !== appointment.slotTime
        );
      }
      await doctorModel.findByIdAndUpdate(appointment.docId, { slots_booked });
    }

    // Instead of deleting, mark as cancelled
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};




export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment }





