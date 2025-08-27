import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"


const changeAvailablity = async (req, res) => {
    try {
        
        const { docId } = req.body
        
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({success:true,message:'Availability Changed'})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    } 
}

const doctorList = async (req,res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        
        res.json({ success: true, doctors })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//API for doctor Login

const loginDoctor = async (req, res) => {
    
    try {

        const { email, password } = req.body
        const doctor = await doctorModel.findOne({ email })
        
        if (!doctor) {
            return res.json({ success: false, message: "Invalid credentials" })
            
        }

        const isMatch = await bcrypt.compare(password, doctor.password)
        
        if (isMatch) {
            
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            
            res.json({success:true,token})

        } else {
            res.json({ success: false, message: "Invalid credentials" })
            
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

//API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    // take docId from req (set by authDoctor middleware)
    const docId = req.docId;  

    const appointments = await appointmentModel.find({ docId });
    
    res.json({ success: true, appointments });
        
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body; 
    const docId = req.docId;  // ✅ set by authDoctor

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentId && appointmentData.docId == docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: "Appointment Completed" });
    } else {
      return res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


//API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body; 
    const docId = req.docId;  // ✅ set by authDoctor

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentId && appointmentData.docId == docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
      return res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get dashboard data for doctor panel
// const doctorDashboard = async (req, res) => {
  
//   try {

//     const docId = req.docId; 

//     const appointments = await appointmentModel.find({ docId })
    
//     let earnings = 0;
//     appointments.map((item) => {
//       if (item.isCompleted || item.payment) {
        
//       }
//     })

//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }

// }


export { changeAvailablity, doctorList, loginDoctor, appointmentsDoctor, appointmentCancel, appointmentComplete }



