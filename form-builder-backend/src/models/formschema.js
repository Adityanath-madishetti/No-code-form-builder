import mongoose from "mongoose";

const { Schema } = mongoose;

/* ---------------- COMPONENT ---------------- */




// [|]
const ComponentSchema = new Schema(
    {


        componentId:{
            type:String,
            required:true,
        },

        componentType:{
            type: {
                type: String,
                required: true,
                enum: ["input-box", "paragraph", "number", "checkbox", "radio", "MCQ", "email", "date", "custom"]
            },

            customKey: {
                type: String // e.g. "rating-stars"
            }
        },
        // should u fill it or not
        required:{
            type:Boolean,
            default:false
        },
        // this mat have score in it if its a quiz
        // thats i soptions or min max raneg for slider
        // drowp down options 
        // it i scomp specific
        // may have is_autograderd
        props: {
            type: Schema.Types.Mixed,
            default:{}
        },
        // like regex or min max or something taht is based on component
        validation:{
            type:Schema.Types.Mixed,
        }
    },
    { _id: false }
);

// [|]
/* ---------------- PAGE ---------------- */
const PageSchema = new Schema(
    {
        pageNo: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        components: {
            type: [ComponentSchema],
            default: []
        }
    },
    { _id: false }
);

// [|]
/* ---------------- LOGIC ---------------- */

const LogicRuleSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["visibility", "skip", "calculation"]
        },

        target: String,

        condition: {
            field: String,
            operator: String,
            value: Schema.Types.Mixed
        }
    },
    { _id: false }
);

/* ---------------- WORKFLOW ---------------- */

const TransitionSchema = new Schema(
    {
        from: String,
        to: String,
        role: String,
        condition: String
    },
    { _id: false }
);

const WorkflowSchema = new Schema(
    {
        states: [String],

        transitions: [TransitionSchema]
    },
    { _id: false }
);

/* ---------------- VERSION HISTORY ---------------- */

const VersionHistorySchema = new Schema(
    {
        version: Number,
        createdBy: String,
        createdAt: Date,
        message: String
    },
    { _id: false }
);

/* ---------------- ACCESS ---------------- */

const AccessSchema = new Schema(
    {
        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "private"
        },

        editors: [String],

        roles: Schema.Types.Mixed
    },
    { _id: false }
);


// [|]
/* ---------------- SETTINGS ---------------- */

const SettingsSchema = new Schema(
    {
        allowMultipleSubmissions: {
            type: Boolean,
            default: false
        },
        requireLogin:   {
            type:Boolean,
            default:false
        },
        // so anonymity should be explicit at frontend 
        collectEmail: {
            type: Boolean,
            default: false,
        },
        saveDraft: Boolean,

        showProgressBar: {
            type: Boolean,
            default: false,
        },
        submissionLimit : Number, // it will be presnet in only

    },
    { _id: false }
);

/**************** */

const ThemeSchema = new Schema(
    {
            themeId : {
                type: String,
                required : true,
            }
    },
    {_id:false}
);


// [|]
/* ---------------- META ---------------- */

const MetaSchema = new Schema(
    {
        createdBy: {
            type: String, // id of author
            required: true,
        },

        //title
        name: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        theme: ThemeSchema,

        version: {
            type: Number,
            validate: {
                validator: Number.isInteger,
                message: "Age must be an integer"
            }
        },

        isMultiPage: Boolean, // idk whats the use of it 

        is_quiz: {
            type: Boolean,
            default: false,
        }
    },
    {_id:false}
);

/* ---------------- MAIN FORM ---------------- */

const FormSchema = new Schema({

    formId: {
        type: String,
        required: true,
        unique: true
    },

    version: {
        type: Number,
        default: 1
    },

    versionHistory: [VersionHistorySchema],

    meta: MetaSchema,

    settings: {
        type:SettingsSchema,
        required : true,
    },
        
    pages: [PageSchema],

    logic: {
        rules: [LogicRuleSchema]
    },

    workflow: WorkflowSchema,

    access: AccessSchema

},
    { timestamps: true });


export default mongoose.model("Form", FormSchema);