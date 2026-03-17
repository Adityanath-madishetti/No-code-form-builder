import mongoose, { Schema } from "mongoose";


const FormSchema = new Schema({
    
    formId: {
        type: String,
        required: true,
        unique: true
    },
    // null untill published
    // this i sto be served



    currentVersion: {
        type: Number,
        required:true
    },
    // accepting submissions or not
    isActive : {
        type : Boolean,
        default: false
        
    },

    cratedBy: {
        type:String,
        required:true,
    },
},  {timestamps:true})

export default mongoose.model("Form", FormSchema);
