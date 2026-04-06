import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "No-Code Form Builder API",
      version: "1.0.0",
      description: "API Documentation for the No-Code Form Builder and Workflow Engine.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Firebase Auth JWT Token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ["./src/routes/*.js", "./src/app.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
