import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, verbose: true });

/**
 * JSON Schema for validating a FormVersion payload
 * when saving/updating from the builder (PUT /api/forms/:formId/versions/:version).
 */
const formVersionPayloadSchema = {
    type: "object",
    // 1. Define a reusable, recursive schema block for actions
    $defs: {
        ruleAction: {
            type: "object",
            properties: {
                id: { type: "string" },
                type: {
                    type: "string",
                    enum: [
                        "SHOW",
                        "HIDE",
                        "ENABLE",
                        "DISABLE",
                        "SET_VALUE",
                        "SKIP_PAGE",
                        "CONDITIONAL", // <-- Added support for nested logic
                    ],
                },
                targetId: { type: "string" }, // Empty string is valid for CONDITIONAL
                toPageId: { type: "string" },
                
                // Safe way to allow any type without crashing AJV strict mode
                value: { 
                    type: ["string", "number", "boolean", "object", "array", "null"] 
                },
                
                // Nested properties for CONDITIONAL actions
                condition: { type: ["object", "null"] },
                thenActions: {
                    type: "array",
                    items: { $ref: "#/$defs/ruleAction" }, // Recursive reference
                },
                elseActions: {
                    type: "array",
                    items: { $ref: "#/$defs/ruleAction" }, // Recursive reference
                },
            },
            required: ["id", "type", "targetId"],
        },
    },
    properties: {
        meta: {
            type: "object",
            properties: {
                createdBy: { type: "string" },
                name: { type: "string", minLength: 1 },
                description: { type: "string" },
                isDraft: { type: "boolean" },
                isMultiPage: { type: "boolean" },
                isQuiz: { type: "boolean" },
                
            },
            required: ["createdBy", "name"],
        },
        theme: {
            type: "object",
            properties: {
                color: { type: "string" },
                mode: { type: "string" },
                headingFont: { 
                    type: "object",properties: {
                        family: { type: "string" } 
                    }
                },
                bodyFont: { 
                    type: "object", 
                    properties: {
                        family: { type: "string" }
                    }
                },
                // primaryColor: { type: "string" },
                // backgroundColor: { type: "string" },
            },
        },
        settings: {
            type: "object",
            properties: {
                allowMultipleSubmissions: { type: "boolean" },
                requireLogin: { type: "boolean" },
                collectEmail: { type: "boolean" },
                collectEmailMode: {
                    type: "string",
                    enum: ["none", "optional", "required"],
                },
                submissionPolicy: {
                    type: "string",
                    enum: ["none", "edit_only", "resubmit_only", "edit_and_resubmit"],
                },
                canViewOwnSubmission: { type: "boolean" },
                saveDraft: { type: "boolean" },
                showProgressBar: { type: "boolean" },
                submissionLimit: {
                    anyOf: [
                        { type: "number", minimum: 0 },
                        { type: "null" },
                    ],
                },
                closeDate: {
                    anyOf: [
                        { type: "string" },
                        { type: "null" },
                    ],
                },
                confirmationMessage: { type: "string" },
                notifyOnSubmission: { type: "boolean" },
            },
        },
        access: {
            type: "object",
            properties: {
                visibility: {
                    type: "string",
                    enum: ["public", "private", "link-only"],
                },
                editors: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            uid: { type: "string" },
                            email: { type: "string" },
                        },
                    },
                },
                reviewers: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            uid: { type: "string" },
                            email: { type: "string" },
                        },
                    },
                },
                viewers: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            uid: { type: "string" },
                            email: { type: "string" },
                        },
                    },
                },
            },
        },
        pages: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    pageId: { type: "string" },
                    pageNo: { type: "number", minimum: 1 },
                    title: { type: "string" },
                    description: { type: "string" },
                    components: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                componentId: { type: "string" },
                                componentType: { type: "string" },
                                label: { type: "string" },
                                description: { type: "string" },
                                required: { type: "boolean" },
                                group: {
                                    type: "string",
                                    enum: ["layout", "input", "selection"],
                                },
                                order: { type: "number" },
                                props: { type: "object" }, 
                                validation: { type: "object" },
                            },
                            required: ["componentId", "componentType"],
                        },
                    },
                    defaultPreviousPageId: { type: "string" },
                    defaultNextPageId: { type: "string" },
                },
                required: ["pageId", "pageNo"],
            },
        },
        logic: {
            type: "object",
            properties: {
                rules: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            ruleId: { type: "string" },
                            name: { type: "string" },
                            enabled: { type: "boolean" },
                            ruleType: {
                                type: "string",
                                enum: ["field", "validation", "navigation"],
                            },
                            updatedAt: { type: "string" },
                            condition: {
                                type: ["object", "null"],
                            },
                            thenActions: {
                                type: "array",
                                items: { $ref: "#/$defs/ruleAction" },
                            },
                            elseActions: {
                                type: "array",
                                items: { $ref: "#/$defs/ruleAction" },
                            },
                        },
                        required: ["ruleId", "condition"],
                    },
                },
                formulas: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            ruleId: { type: "string" },
                            name: { type: "string" },
                            enabled: { type: "boolean" },
                            targetId: { type: "string" },
                            expression: { type: "string" },
                            referencedFields: {
                                type: "array",
                                items: { type: "string" },
                            },
                            updatedAt: { type: "string" },
                        },
                        required: ["ruleId", "targetId", "expression"],
                    },
                },
                componentShuffleStacks: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            stackId: { type: "string" },
                            name: { type: "string" },
                            pageId: { type: "string" },
                            componentIds: {
                                type: "array",
                                items: { type: "string" },
                            },
                            enabled: { type: "boolean" },
                        },
                        required: ["stackId", "name", "pageId", "componentIds", "enabled"],
                    },
                },
            },
        },
    },
};

const validateFormVersionPayload = ajv.compile(formVersionPayloadSchema);

/**
 * Validate a form version payload against the JSON schema.
 *
 * @param {object} data — the payload to validate
 * @returns {{ valid: boolean, errors: object[]|null }}
 */
export function validateFormVersion(data) {
    const valid = validateFormVersionPayload(data);
    return {
        valid,
        errors: valid ? null : validateFormVersionPayload.errors,
    };
}

/**
 * Express middleware: validate request body against the form version schema.
 * Attach to routes that accept form version payloads.
 */
export function validateFormVersionMiddleware(req, res, next) {
    const { valid, errors } = validateFormVersion(req.body);

    if (!valid) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors.map((e) => ({
                path: e.instancePath,
                message: e.message,
                params: e.params,
            })),
        });
    }

    next();
}