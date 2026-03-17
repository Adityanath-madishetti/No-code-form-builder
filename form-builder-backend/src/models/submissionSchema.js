import mongoose, { mongo } from "mongoose";



const SubmissionCompSchema =  new mongoose.Schema(
    {
        componentId : {
            type:String,
            required:true,
        },

        // need to agree upon
        response :{ 
            type: mongoose.Schema.Types.Mixed,
            default:{}
        }

    }
)


const SubmissionPageSchema = new mongoose.Schema({
    pageNo:{
        type: Number,
        required: true
    },

    responses : [SubmissionCompSchema]

})

const SubmissionMetaSchema = new mongoose.Schema({
    // it should match with taht of respective form
     is_quiz: Boolean,

})


const SubmissionFormSchema = new mongoose.Schema(
    {
        submissionId:{
            type: String,
            required: true,
            unique: true
        },

        formId: {
            type: String,
            required: true,
        },
    
        version:{
            type:Number,
            required:true
        },

        meta : SubmissionMetaSchema,

        pages : [SubmissionPageSchema],



    },
    {timestamps:true}
)
export default mongoose.model("SubmissionForm", SubmissionFormSchema);